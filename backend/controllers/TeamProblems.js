import connection from "../database/db.js";
import { loadFiles } from "../utils/submissionFiles.js";
import AsyncHandler from "../utils/AsyncHandler.js";

// Teams submit to any open challenge directly (there is no request / assignment step any more).
// A team may have one solution per challenge, and can work on any number of challenges until
// MAX_ACCEPTED of its solutions are "Concept accepted"; after that it cannot start new ones.
// A challenge an admin closed ("Concept Received") takes no new solutions.
export const MAX_ACCEPTED = 3;

const isAdmin = (req) => req.user.ROLE === "ADMIN";
const ACCEPTED_STATUSES = "('APPROVED', 'ACCEPTED')";

// How many of the team's solutions are "Concept accepted"
export const acceptedCount = async (leadEmail) => {
    if (!leadEmail) return 0;
    const [[row]] = await connection.query(
        `SELECT COUNT(*) AS n FROM SolveForSakthi_Submissions WHERE TEAM_EMAIL = ? AND STATUS IN ${ACCEPTED_STATUSES}`, [leadEmail]);
    return Number(row?.n) || 0;
};

// Message when the team may not START a new solution, otherwise null
export const newSolutionBlockedReason = async (leadEmail) =>
    (await acceptedCount(leadEmail)) >= MAX_ACCEPTED
        ? `Your team already has ${MAX_ACCEPTED} accepted concepts, which is the maximum. You cannot submit solutions to new challenges.`
        : null;

// Latest submission per (team lead email, challenge) for the given lead emails, with its files
const loadSubmissions = async (leadEmails) => {
    if (leadEmails.length === 0) return new Map();
    const placeholders = leadEmails.map(() => "?").join(", ");
    const [rows] = await connection.query(`
        SELECT s.ID, s.PROBLEM_ID, s.TEAM_EMAIL, s.SOL_TITLE, s.SOL_DESCRIPTION, s.SOL_LINK, s.FILES, s.SUB_DATE, s.STATUS,
               s.EVALUATION_COMMENT, s.EVALUATED_AT,
               s.EVAL_UNDERSTANDING, s.EVAL_SOLUTION, s.EVAL_TOOLS, s.EVAL_PRESENTATION, s.EVAL_ACCEPTANCE, s.EVAL_TOTAL,
               p.TITLE, p.CATEGORY, p.IS_CLOSED
        FROM SolveForSakthi_Submissions s
        LEFT JOIN SolveForSakthi_Problems p ON p.ID = s.PROBLEM_ID
        WHERE s.TEAM_EMAIL IN (${placeholders})
        ORDER BY s.ID DESC`, leadEmails);
    const files = await loadFiles(rows.map((r) => r.ID));
    const latest = new Map();
    for (const row of rows) {
        row.files = files.get(Number(row.ID)) || [];
        row.IS_CLOSED = Boolean(row.IS_CLOSED);
        const key = `${String(row.TEAM_EMAIL).toLowerCase()}|${row.PROBLEM_ID}`;
        if (!latest.has(key)) latest.set(key, row);
    }
    return latest;
};

const isAccepted = (status) => ["APPROVED", "ACCEPTED"].includes(String(status || "").toUpperCase());

// SPOC (or admin with ?spocId): every active team with the solutions it submitted
const Get_spoc_progress = AsyncHandler(async (req, res) => {
    const spocId = isAdmin(req) && req.query.spocId ? Number(req.query.spocId) : req.user.ID;
    const [teams] = await connection.query(`
        SELECT t.ID, t.NAME, t.LEAD_EMAIL, t.LEAD_PHONE, t.MENTOR_NAME, t.MENTOR_EMAIL,
               (SELECT COUNT(*) FROM SolveForSakthi_Team_Members_List m WHERE m.Team_ID = t.ID) AS MEMBER_COUNT
        FROM SolveForSakthi_Team_List t
        WHERE t.SPOC_ID = ? AND t.GRADUATED_AT IS NULL
        ORDER BY t.ID`, [spocId]);
    if (teams.length === 0) return res.json({ teams: [], maxAccepted: MAX_ACCEPTED });

    const submissions = await loadSubmissions(teams.map((t) => t.LEAD_EMAIL).filter(Boolean));
    res.json({
        maxAccepted: MAX_ACCEPTED,
        teams: teams.map((team) => {
            const lead = `${String(team.LEAD_EMAIL || "").toLowerCase()}|`;
            const solutions = [...submissions.entries()].filter(([key]) => key.startsWith(lead)).map(([, s]) => s);
            return { ...team, solutions, ACCEPTED_COUNT: solutions.filter((s) => isAccepted(s.STATUS)).length };
        }),
    });
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

// Student: every challenge, with this team's solution for each, and whether the team may still start new ones
const Get_student_overview = AsyncHandler(async (req, res) => {
    const team = await loadStudentTeam(req.user.EMAIL);
    const [problems] = await connection.query(`
        SELECT p.ID AS PROBLEM_ID, p.TITLE, p.DESCRIPTION, p.CATEGORY, p.DEPT, p.IS_CLOSED, p.CLOSED_AT,
               p.DOMAIN, p.EXPECTED_OUTCOMES, p.REQUIREMENTS, p.TECHNOLOGY
        FROM SolveForSakthi_Problems p
        ORDER BY p.ID DESC`);

    const submissions = await loadSubmissions(team ? [team.LEAD_EMAIL] : []);
    const accepted = team ? [...submissions.values()].filter((s) => isAccepted(s.STATUS)).length : 0;
    const { SPOC_ID, ...teamInfo } = team || {};
    res.json({
        team: team ? teamInfo : null,
        acceptedCount: accepted,
        maxAccepted: MAX_ACCEPTED,
        limitReached: accepted >= MAX_ACCEPTED,
        problems: problems.map((p) => ({
            ...p,
            IS_CLOSED: Boolean(p.IS_CLOSED),
            submission: submissions.get(`${String(team?.LEAD_EMAIL || "").toLowerCase()}|${p.PROBLEM_ID}`) || null,
        })),
    });
});

export { Get_spoc_progress, Get_student_overview };
