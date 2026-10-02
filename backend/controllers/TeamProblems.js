import connection from "../database/db.js";
import { loadFiles } from "../utils/submissionFiles.js";
import AsyncHandler from "../utils/AsyncHandler.js";
import { today, checkProblemOpen } from "../utils/deadline.js";
import { notifyTeamAssigned, notifyProblemRequested, notifyRequestRejected } from "../utils/notifications.js";

// Team <-> problem statement states (SolveForSakthi_Team_Problems.STATUS)
//   REQUESTED - the team asked its SPOC for the problem
//   ASSIGNED  - the SPOC approved the request or assigned it directly; the team may submit
//   REJECTED  - the SPOC declined the request; the team may request it again
const ASSIGNED = "ASSIGNED";
const REQUESTED = "REQUESTED";
const REJECTED = "REJECTED";

const isAdmin = (req) => req.user.ROLE === "ADMIN";
const toDay = (value) => (value instanceof Date ? value.toISOString().slice(0, 10) : value ? String(value).slice(0, 10) : null);

// Latest submission per (team lead email, problem) for the given lead emails
const loadSubmissions = async (leadEmails) => {
    if (leadEmails.length === 0) return new Map();
    const placeholders = leadEmails.map(() => "?").join(", ");
    const [rows] = await connection.query(`
        SELECT ID, PROBLEM_ID, TEAM_EMAIL, SOL_TITLE, SOL_DESCRIPTION, SOL_LINK, FILES, SUB_DATE, STATUS,
               EVALUATION_COMMENT, EVALUATED_AT,
               EVAL_UNDERSTANDING, EVAL_SOLUTION, EVAL_TOOLS, EVAL_PRESENTATION, EVAL_ACCEPTANCE, EVAL_TOTAL
        FROM SolveForSakthi_Submissions
        WHERE TEAM_EMAIL IN (${placeholders})
        ORDER BY ID DESC`, leadEmails);
    const files = await loadFiles(rows.map((r) => r.ID));
    const latest = new Map();
    for (const row of rows) {
        row.files = files.get(Number(row.ID)) || [];
        const key = `${String(row.TEAM_EMAIL).toLowerCase()}|${row.PROBLEM_ID}`;
        if (!latest.has(key)) latest.set(key, row);
    }
    return latest;
};

// Adds DEADLINE_PASSED and the team's latest submission to a problem row
const withProgress = (row, leadEmail, submissions, todayStr) => {
    const deadline = toDay(row.SUB_DEADLINE);
    return {
        ...row,
        DEADLINE_PASSED: Boolean(deadline && todayStr > deadline),
        submission: submissions.get(`${String(leadEmail || "").toLowerCase()}|${row.PROBLEM_ID}`) || null,
    };
};

// SPOC: every team of theirs with members, requested/assigned problems, submission status and review comment
const Get_spoc_progress = AsyncHandler(async (req, res) => {
    const spocId = isAdmin(req) && req.query.spocId ? Number(req.query.spocId) : req.user.ID;
    const [teams] = await connection.query(`
        SELECT t.ID, t.NAME, t.LEAD_EMAIL, t.LEAD_PHONE, t.MENTOR_NAME, t.MENTOR_EMAIL,
               (SELECT COUNT(*) FROM SolveForSakthi_Team_Members_List m WHERE m.Team_ID = t.ID) AS MEMBER_COUNT
        FROM SolveForSakthi_Team_List t
        WHERE t.SPOC_ID = ? AND t.GRADUATED_AT IS NULL
        ORDER BY t.ID`, [spocId]);
    if (teams.length === 0) return res.json({ teams: [] });

    const [assignments] = await connection.query(`
        SELECT tp.TEAM_ID, tp.STATUS AS ASSIGNMENT_STATUS, tp.REQUESTED_DATE, tp.ASSIGNED_DATE,
               p.ID AS PROBLEM_ID, p.TITLE, p.DESCRIPTION, p.CATEGORY, p.SUB_DEADLINE, p.Reference
        FROM SolveForSakthi_Team_Problems tp
        JOIN SolveForSakthi_Problems p ON p.ID = tp.PROBLEM_ID
        WHERE tp.TEAM_ID IN (${teams.map(() => "?").join(", ")})
        ORDER BY p.SUB_DEADLINE, p.ID`, teams.map((t) => t.ID));

    const submissions = await loadSubmissions(teams.map((t) => t.LEAD_EMAIL).filter(Boolean));
    const todayStr = today();
    res.json({
        teams: teams.map((team) => ({
            ...team,
            problems: assignments
                .filter((a) => a.TEAM_ID === team.ID)
                .map(({ TEAM_ID, ...a }) => withProgress(a, team.LEAD_EMAIL, submissions, todayStr)),
        })),
    });
});

// Loads a team and checks the caller may manage it (its own SPOC, or an admin)
const loadOwnedTeam = async (req, res, teamId) => {
    // an admin assigning or rejecting problems for a team needs "Manage users"
    if (isAdmin(req) && !req.user.IS_SUPER_ADMIN && !req.user.PERMISSIONS?.includes("USERS")) {
        res.status(403).json({ message: 'You need the "Manage users" permission for this' });
        return null;
    }
    const [rows] = await connection.query("SELECT ID, SPOC_ID, LEAD_EMAIL, GRADUATED_AT, REMOVED_AT FROM SolveForSakthi_Team_List WHERE ID = ?", [teamId]);
    const team = rows[0];
    if (!team) {
        res.status(404).json({ message: "Team not found" });
        return null;
    }
    if (team.GRADUATED_AT) {
        res.status(400).json({ message: team.REMOVED_AT ? "This team was removed; its records are read-only" : "This team has graduated; its records are read-only" });
        return null;
    }
    if (!isAdmin(req) && team.SPOC_ID !== req.user.ID) {
        res.status(403).json({ message: "You can only manage your own teams" });
        return null;
    }
    return team;
};

const parseIds = (req, res) => {
    const teamId = parseInt(req.body.teamId, 10);
    const problemId = parseInt(req.body.problemId, 10);
    if (Number.isNaN(teamId) || Number.isNaN(problemId)) {
        res.status(400).json({ message: "teamId and problemId are required" });
        return null;
    }
    return { teamId, problemId };
};

const findAssignment = async (teamId, problemId) => {
    const [rows] = await connection.query("SELECT ID, STATUS FROM SolveForSakthi_Team_Problems WHERE TEAM_ID = ? AND PROBLEM_ID = ?", [teamId, problemId]);
    return rows[0];
};

// SPOC assigns a problem directly, or approves a team's request for it
const Assign_problem = AsyncHandler(async (req, res) => {
    const ids = parseIds(req, res);
    if (!ids) return;
    const { teamId, problemId } = ids;

    const team = await loadOwnedTeam(req, res, teamId);
    if (!team) return;

    const closedReason = await checkProblemOpen(problemId);
    if (closedReason) {
        return res.status(400).json({ message: closedReason });
    }

    const existing = await findAssignment(teamId, problemId);
    if (existing?.STATUS === ASSIGNED) {
        return res.status(409).json({ message: "This problem is already assigned to the team" });
    }

    if (existing) {
        await connection.query("UPDATE SolveForSakthi_Team_Problems SET STATUS = ?, ASSIGNED_BY = ?, ASSIGNED_DATE = ? WHERE ID = ?", [ASSIGNED, req.user.ID, today(), existing.ID]);
    } else {
        await connection.query("INSERT INTO SolveForSakthi_Team_Problems (TEAM_ID, PROBLEM_ID, STATUS, ASSIGNED_BY, ASSIGNED_DATE) VALUES (?, ?, ?, ?, ?)", [teamId, problemId, ASSIGNED, req.user.ID, today()]);
    }
    const approvedRequest = existing?.STATUS === REQUESTED;
    notifyTeamAssigned(teamId, problemId, approvedRequest);
    res.status(201).json({ message: approvedRequest ? "Request approved" : "Problem assigned" });
});

// SPOC declines a team's request
const Reject_request = AsyncHandler(async (req, res) => {
    const ids = parseIds(req, res);
    if (!ids) return;
    const { teamId, problemId } = ids;

    const team = await loadOwnedTeam(req, res, teamId);
    if (!team) return;

    const existing = await findAssignment(teamId, problemId);
    if (existing?.STATUS !== REQUESTED) {
        return res.status(400).json({ message: "There is no pending request for this problem" });
    }
    await connection.query("UPDATE SolveForSakthi_Team_Problems SET STATUS = ? WHERE ID = ?", [REJECTED, existing.ID]);
    notifyRequestRejected(teamId, problemId);
    res.json({ message: "Request rejected" });
});

const Unassign_problem = AsyncHandler(async (req, res) => {
    const ids = parseIds(req, res);
    if (!ids) return;
    const { teamId, problemId } = ids;

    const team = await loadOwnedTeam(req, res, teamId);
    if (!team) return;

    // once the team has submitted, the assignment is part of its record
    const [submitted] = await connection.query("SELECT TOP 1 ID FROM SolveForSakthi_Submissions WHERE TEAM_EMAIL = ? AND PROBLEM_ID = ?", [team.LEAD_EMAIL, problemId]);
    if (submitted.length > 0) {
        return res.status(400).json({ message: "The team already submitted a solution for this problem, it cannot be unassigned" });
    }

    const [result] = await connection.query("DELETE FROM SolveForSakthi_Team_Problems WHERE TEAM_ID = ? AND PROBLEM_ID = ?", [teamId, problemId]);
    if (result.affectedRows === 0) {
        return res.status(404).json({ message: "This problem is not assigned to the team" });
    }
    res.json({ message: "Problem unassigned" });
});

// The team led by the logged-in student (with its college), or undefined
const loadStudentTeam = async (email) => {
    const [teams] = await connection.query(`
        SELECT t.ID, t.NAME, t.LEAD_EMAIL, t.MENTOR_NAME, t.MENTOR_EMAIL, t.SPOC_ID, spoc.COLLEGE
        FROM SolveForSakthi_Team_List t
        LEFT JOIN SolveForSakthi_Users spoc ON spoc.ID = t.SPOC_ID
        WHERE t.LEAD_EMAIL = ? AND t.GRADUATED_AT IS NULL`, [email]);
    return teams[0];
};

// Student: every problem statement, with this team's request/assignment state and submission for each
const Get_student_overview = AsyncHandler(async (req, res) => {
    const team = await loadStudentTeam(req.user.EMAIL);
    const [problems] = await connection.query(`
        SELECT p.ID AS PROBLEM_ID, p.TITLE, p.DESCRIPTION, p.CATEGORY, p.DEPT, p.SUB_DEADLINE,
               p.DOMAIN, p.EXPECTED_OUTCOMES, p.REQUIREMENTS, p.TECHNOLOGY,
               tp.STATUS AS ASSIGNMENT_STATUS, tp.REQUESTED_DATE, tp.ASSIGNED_DATE
        FROM SolveForSakthi_Problems p
        LEFT JOIN SolveForSakthi_Team_Problems tp ON tp.PROBLEM_ID = p.ID AND tp.TEAM_ID = ?
        ORDER BY p.ID DESC`, [team ? team.ID : -1]);

    const submissions = await loadSubmissions(team ? [team.LEAD_EMAIL] : []);
    const todayStr = today();
    const { SPOC_ID, ...teamInfo } = team || {};
    res.json({
        team: team ? teamInfo : null,
        problems: problems.map((p) => withProgress(p, team?.LEAD_EMAIL, submissions, todayStr)),
    });
});

// Student asks their SPOC for a problem statement
const Request_problem = AsyncHandler(async (req, res) => {
    const problemId = parseInt(req.body.problemId, 10);
    if (Number.isNaN(problemId)) {
        return res.status(400).json({ message: "problemId is required" });
    }

    const team = await loadStudentTeam(req.user.EMAIL);
    if (!team) {
        return res.status(400).json({ message: "Your account is not linked to a team" });
    }

    const closedReason = await checkProblemOpen(problemId);
    if (closedReason) {
        return res.status(400).json({ message: closedReason });
    }

    const existing = await findAssignment(team.ID, problemId);
    if (existing?.STATUS === ASSIGNED) {
        return res.status(409).json({ message: "This problem is already assigned to your team" });
    }
    if (existing?.STATUS === REQUESTED) {
        return res.status(409).json({ message: "You already requested this problem. Your SPOC will review it." });
    }

    if (existing) {
        await connection.query("UPDATE SolveForSakthi_Team_Problems SET STATUS = ?, REQUESTED_DATE = ? WHERE ID = ?", [REQUESTED, today(), existing.ID]);
    } else {
        await connection.query("INSERT INTO SolveForSakthi_Team_Problems (TEAM_ID, PROBLEM_ID, STATUS, REQUESTED_DATE) VALUES (?, ?, ?, ?)", [team.ID, problemId, REQUESTED, today()]);
    }
    notifyProblemRequested(team.ID, problemId);
    res.status(201).json({ message: "Request sent to your SPOC" });
});

// Student withdraws a request their SPOC has not answered yet
const Cancel_request = AsyncHandler(async (req, res) => {
    const problemId = parseInt(req.body.problemId, 10);
    const team = await loadStudentTeam(req.user.EMAIL);
    if (!team || Number.isNaN(problemId)) {
        return res.status(400).json({ message: "problemId is required" });
    }
    const [result] = await connection.query("DELETE FROM SolveForSakthi_Team_Problems WHERE TEAM_ID = ? AND PROBLEM_ID = ? AND STATUS = ?", [team.ID, problemId, REQUESTED]);
    if (result.affectedRows === 0) {
        return res.status(400).json({ message: "There is no pending request for this problem" });
    }
    res.json({ message: "Request cancelled" });
});

// Is this problem assigned (approved) to the team led by this email?
const isAssignedToTeamOf = async (leadEmail, problemId) => {
    const [rows] = await connection.query(`
        SELECT TOP 1 tp.ID FROM SolveForSakthi_Team_Problems tp
        JOIN SolveForSakthi_Team_List t ON t.ID = tp.TEAM_ID
        WHERE t.LEAD_EMAIL = ? AND tp.PROBLEM_ID = ? AND tp.STATUS = ?`, [leadEmail, problemId, ASSIGNED]);
    return rows.length > 0;
};

export { Get_spoc_progress, Assign_problem, Reject_request, Unassign_problem, Get_student_overview, Request_problem, Cancel_request, isAssignedToTeamOf };
