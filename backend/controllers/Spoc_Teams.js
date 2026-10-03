import connection from "../database/db.js";
import AsyncHandler from "../utils/AsyncHandler.js";
import { loadTeamFor, canViewTeamOfLead } from "../utils/teamAccess.js";

const Fetch_Teams = AsyncHandler(async (req, res) => {
    // console.log(req.params);
    
    const { id } = req.params;
    if (req.user.ROLE !== "ADMIN" && String(req.user.ID) !== String(id)) {
        return res.status(403).json({ message: "You can only view your own teams" })
    }
    // SUBMISSION_COUNT / SUBMITTED feed the dashboard's "submitted" counters
    const [result] = await connection.query(`
        select t.*,
               (select count(*) from SolveForSakthi_Submissions s where s.TEAM_EMAIL = t.LEAD_EMAIL) as SUBMISSION_COUNT,
               case when exists (select 1 from SolveForSakthi_Submissions s where s.TEAM_EMAIL = t.LEAD_EMAIL) then 1 else 0 end as SUBMITTED
        from SolveForSakthi_Team_List t WHERE t.SPOC_ID = ? AND t.GRADUATED_AT IS NULL`, [id])
    
    res.send(result)
})

const Fetch_Team_Members = AsyncHandler(async (req, res) => {
    const { id } = req.body;
    // console.log(id)
    const parsedId = parseInt(id, 10);
    if (Number.isNaN(parsedId)) {
        return res.status(400).json({ message: 'Invalid team id' });
    }
    if (!(await loadTeamFor(req, res, parsedId))) return;

    // use parameterized query to avoid SQL injection
    const [result, err1] = await connection.query("select * from SolveForSakthi_Team_Members_List where Team_ID = ? order by ID", [parsedId]);
    const [mentor, err2] = await connection.query("select MENTOR_NAME, MENTOR_EMAIL, INTERESTS from SolveForSakthi_Team_List where ID = ?", [parsedId]);

    // console.log(result)
    res.json({result : result, mentor:mentor})
})

const Delete_team = AsyncHandler(async (req, res) => {
    const { id } = req.body;
    const team = await loadTeamFor(req, res, id, { manage: true });
    if (!team) return;

    // A team that has submitted a solution is never erased: it is archived (hidden from the SPOC, login
    // closed) and admins keep its details, members, problems, submissions, reviews and emails.
    const [[{ submitted }]] = await connection.query(
        "SELECT COUNT(*) AS submitted FROM SolveForSakthi_Submissions WHERE TEAM_EMAIL = ?", [team.LEAD_EMAIL || ""])
    if (submitted > 0) {
        await connection.query(
            "UPDATE SolveForSakthi_Team_List SET REMOVED_AT = SYSUTCDATETIME(), REMOVED_BY = ?, GRADUATED_AT = COALESCE(GRADUATED_AT, SYSUTCDATETIME()) WHERE ID = ?",
            [req.user.ID, team.ID])
        if (team.LEAD_EMAIL) await connection.query("UPDATE SolveForSakthi_Users SET STATUS = 'REMOVED' WHERE EMAIL = ? AND ROLE = 'STUDENT'", [team.LEAD_EMAIL])
        return res.json({ archived: true, affectedRows: 1, message: "Team removed. It has submitted solutions, so its records are kept for the admins." })
    }

    // never submitted anything: removed completely
    await connection.query("DELETE FROM SolveForSakthi_Team_Problems WHERE TEAM_ID = ?", [id])
    await connection.query("DELETE FROM SolveForSakthi_Team_Members_List WHERE Team_ID = ?", [id])
    const [result] = await connection.query("DELETE FROM SolveForSakthi_Team_List WHERE ID = ?", [id])
    // the team's login goes with it, so the lead's email can be used for a new team later
    if (team.LEAD_EMAIL) {
        await connection.query(
            "DELETE FROM SolveForSakthi_Users WHERE EMAIL = ? AND ROLE = 'STUDENT' AND NOT EXISTS (SELECT 1 FROM SolveForSakthi_Team_List WHERE LEAD_EMAIL = ?)",
            [team.LEAD_EMAIL, team.LEAD_EMAIL]
        )
    }
    res.send(result)
})

const Fetch_Team_For_Students = AsyncHandler(async (req, res) => {
    const { id } = req.body;
    const team = await loadTeamFor(req, res, id);
    if (!team) return;
    res.send([team])
})

const fetch_team_id_email = AsyncHandler(async (req, res) => {
    // a student can only look up their own team
    const email = req.user.ROLE === "STUDENT" ? req.user.EMAIL : req.body.email;
    if (!(await canViewTeamOfLead(req, email))) {
        return res.status(403).json({ message: "You do not have access to this team" })
    }
    const [data, extra] = await connection.query("SELECT ID FROM SolveForSakthi_Team_List WHERE LEAD_EMAIL = ?", [email])
    
    res.send(data)
})

// Builds the admin team records (all teams, or just one with teamId)
const buildAdminTeams = async (teamId = null) => {
    const one = teamId != null;
    const [teams] = await connection.query(`
        SELECT t.ID, t.NAME, t.LEAD_EMAIL, t.LEAD_PHONE, t.MENTOR_NAME, t.MENTOR_EMAIL, t.CREATED_AT, t.SPOC_ID, t.INTERESTS,
               t.GRADUATED_AT, t.REMOVED_AT, rb.EMAIL AS REMOVED_BY_EMAIL, COALESCE(t.GRADUATION_YEAR, (SELECT MAX(m.GRAD_YEAR) FROM SolveForSakthi_Team_Members_List m WHERE m.Team_ID = t.ID)) AS GRADUATION_YEAR,
               spoc.NAME AS SPOC_NAME, spoc.EMAIL AS SPOC_EMAIL, spoc.COLLEGE, spoc.COLLEGE_CODE,
               (SELECT COUNT(*) FROM SolveForSakthi_Team_Members_List m WHERE m.Team_ID = t.ID) AS MEMBER_COUNT,
               CASE WHEN EXISTS (SELECT 1 FROM SolveForSakthi_Users u WHERE u.EMAIL = t.LEAD_EMAIL AND u.ROLE = 'STUDENT') THEN 1 ELSE 0 END AS HAS_LOGIN
        FROM SolveForSakthi_Team_List t
        LEFT JOIN SolveForSakthi_Users spoc ON spoc.ID = t.SPOC_ID
        LEFT JOIN SolveForSakthi_Users rb ON rb.ID = t.REMOVED_BY
        ${one ? "WHERE t.ID = ?" : ""}
        ORDER BY t.ID DESC`, one ? [teamId] : []);

    const [submissions] = await connection.query(`
        SELECT s.ID, s.PROBLEM_ID, s.TEAM_EMAIL, s.STATUS, s.EVALUATION_COMMENT, s.EVAL_TOTAL, s.SUB_DATE, p.TITLE
        FROM SolveForSakthi_Submissions s
        LEFT JOIN SolveForSakthi_Problems p ON p.ID = s.PROBLEM_ID
        ${one ? "WHERE s.TEAM_EMAIL = ?" : ""}
        ORDER BY s.ID DESC`, one ? [teams[0]?.LEAD_EMAIL || ""] : []);

    // latest submission per team lead + problem
    const latest = new Map();
    for (const s of submissions) {
        const key = `${String(s.TEAM_EMAIL || "").toLowerCase()}|${s.PROBLEM_ID}`;
        if (!latest.has(key)) latest.set(key, s);
    }

    return teams.map((team) => {
        const lead = String(team.LEAD_EMAIL || "").toLowerCase();
        // the challenges the team submitted a solution to (latest solution for each)
        const list = [];
        for (const [key, s] of latest) {
            if (!lead || !key.startsWith(`${lead}|`)) continue;
            list.push({ PROBLEM_ID: s.PROBLEM_ID, TITLE: s.TITLE, submission: { ID: s.ID, STATUS: s.STATUS, COMMENT: s.EVALUATION_COMMENT, TOTAL: s.EVAL_TOTAL, SUB_DATE: s.SUB_DATE } });
        }
        return {
            ...team,
            HAS_LOGIN: Boolean(team.HAS_LOGIN),
            problems: list,
            SUBMISSION_COUNT: list.length,
            EVALUATED_COUNT: list.filter((p) => p.submission.STATUS !== "PENDING").length,
            ACCEPTED_COUNT: list.filter((p) => ["APPROVED", "ACCEPTED"].includes(p.submission.STATUS)).length,
        };
    });
};

// Admin: every registered team with its SPOC / college, members, challenges and submissions,
// for the Teams section of the admin Users page (filtered and paged in the browser)
const Admin_list_teams = AsyncHandler(async (req, res) => {
    res.json(await buildAdminTeams());
});

// Admin: one team in the same shape (the team details dialog opened from a problem or submission page)
const Admin_get_team = AsyncHandler(async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ message: "Invalid team id" });
    const [team] = await buildAdminTeams(id);
    if (!team) return res.status(404).json({ message: "This team no longer exists" });
    res.json(team);
});

// Admin: everything on record for one team (also after it graduated): members, every submission with its
// full review history, and every email sent to the team's addresses
const Admin_team_history = AsyncHandler(async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ message: "Invalid team id" });
    const [teams] = await connection.query("SELECT ID, LEAD_EMAIL, MENTOR_EMAIL FROM SolveForSakthi_Team_List WHERE ID = ?", [id]);
    const team = teams[0];
    if (!team) return res.status(404).json({ message: "Team not found" });

    const [members] = await connection.query("SELECT ID, ROLE, NAME, EMAIL, PHONE, GENDER, GRAD_YEAR FROM SolveForSakthi_Team_Members_List WHERE Team_ID = ? ORDER BY ID", [id]);

    const [submissions] = team.LEAD_EMAIL ? await connection.query(`
        SELECT s.ID, s.PROBLEM_ID, p.TITLE AS PROBLEM_TITLE, s.SOL_TITLE, s.SOL_DESCRIPTION, s.SOL_LINK, s.FILES,
               s.SUB_DATE, s.STATUS, s.EVALUATION_COMMENT, s.EVALUATED_AT, s.EVAL_TOTAL
        FROM SolveForSakthi_Submissions s
        LEFT JOIN SolveForSakthi_Problems p ON p.ID = s.PROBLEM_ID
        WHERE s.TEAM_EMAIL = ?
        ORDER BY s.ID DESC`, [team.LEAD_EMAIL]) : [[]];

    const [reviews] = submissions.length ? await connection.query(`
        SELECT r.ID, r.SUBMISSION_ID, r.DECISION, r.COMMENT, r.REVIEWED_AT, u.EMAIL AS REVIEWER_EMAIL, u.NAME AS REVIEWER_NAME, r.EVAL_TOTAL
        FROM SolveForSakthi_Submission_Reviews r
        LEFT JOIN SolveForSakthi_Users u ON u.ID = r.REVIEWED_BY
        WHERE r.SUBMISSION_ID IN (${submissions.map(() => "?").join(", ")})
        ORDER BY r.ID DESC`, submissions.map((s) => s.ID)) : [[]];

    // mails to or copied to any team address (lead, members, mentor)
    const addresses = [...new Set([team.LEAD_EMAIL, team.MENTOR_EMAIL, ...members.map((m) => m.EMAIL)]
        .filter(Boolean).map((e) => String(e).trim().toLowerCase()))];
    const [mails] = addresses.length ? await connection.query(`
        SELECT TOP 500 ID, TO_ADDR, CC_ADDR, SUBJECT, BODY_TEXT, STATUS, ERROR, SENT_AT
        FROM SolveForSakthi_Mail_Log
        WHERE ${addresses.map(() => "(LOWER(TO_ADDR) LIKE ? OR LOWER(CC_ADDR) LIKE ?)").join(" OR ")}
        ORDER BY ID DESC`, addresses.flatMap((a) => {
        // _ and % are LIKE wildcards; [_] matches a literal underscore
        const pattern = `%${a.replace(/[%_[]/g, "[$&]")}%`;
        return [pattern, pattern];
    })) : [[]];

    res.json({
        members,
        submissions: submissions.map((s) => ({ ...s, reviews: reviews.filter((r) => r.SUBMISSION_ID === s.ID) })),
        mails,
    });
});

export { Fetch_Teams, Fetch_Team_Members, Delete_team, Fetch_Team_For_Students, fetch_team_id_email, Admin_list_teams, Admin_get_team, Admin_team_history }