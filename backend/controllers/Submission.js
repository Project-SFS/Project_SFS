import AsyncHandler from "../utils/AsyncHandler.js";
import connection from "../database/mysql.js";

/* ====================== SUBMIT SOLUTION ====================== */

const SubmitSolution = AsyncHandler(async (req, res) => {
    const { problemId, teamId, SOL_LINK, SOL_TITLE = null, SOL_DESCRIPTION = null } = req.body;

    if (!problemId || !teamId || !SOL_LINK) {
        return res.status(400).json({ message: "problemId, teamId and SOL_LINK are required" });
    }

    const [teamExists] = await connection.query(
        "SELECT ID FROM Team_List WHERE ID = ?",
        [teamId]
    );

    if (teamExists.length === 0) {
        return res.status(404).json({ message: "Team not found" });
    }

    const SUB_DATE = new Date().toISOString().slice(0, 10);
    const status = "PENDING";

    await connection.query(
        `
        INSERT INTO submissions
        (PROBLEM_ID, TEAM_ID, SOL_TITLE, SOL_DESCRIPTION, SUB_DATE, STATUS, SOL_LINK)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        [problemId, teamId, SOL_TITLE, SOL_DESCRIPTION, SUB_DATE, status, SOL_LINK]
    );

    res.status(201).json({
        message: "Solution submitted successfully",
        submissionId: null
    });
});

/* ====================== GET SOLUTION ====================== */

const Get_solution = AsyncHandler(async (req, res) => {
    const { teamId } = req.params;

    const [result] = await connection.query(
        "SELECT * FROM submissions WHERE TEAM_ID = ?",
        [teamId]
    );

    res.status(200).json(result);
});

/* ====================== GET ALL SUBMISSIONS ====================== */

const Get_all_submissions = AsyncHandler(async (req, res) => {
    const { problemId, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let baseQuery = "SELECT * FROM submissions";
    const params = [];

    if (problemId) {
        baseQuery += " WHERE PROBLEM_ID = ?";
        params.push(problemId);
    }

    const [countResult] = await connection.query(
        `SELECT COUNT(*) AS total FROM (${baseQuery}) AS sub`,
        params
    );

    const total = countResult[0].total;

    const paginatedQuery = `
        ${baseQuery}
        ORDER BY SUB_DATE DESC
        OFFSET ? ROWS FETCH NEXT ? ROWS ONLY
    `;

    params.push(parseInt(offset), parseInt(limit));

    const [result] = await connection.query(paginatedQuery, params);

    res.status(200).json({
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
        submissions: result
    });
});

/* ====================== GET SUBMISSIONS BY PROBLEM ====================== */

const Get_submission_by_prob_id = AsyncHandler(async (req, res) => {
    const { id } = req.body;

    const [data] = await connection.query(
        `
        SELECT
            s.ID AS submission_id,
            s.PROBLEM_ID,
            s.SOL_TITLE,
            s.SOL_DESCRIPTION,
            s.SUB_DATE,
            s.STATUS,
            s.SOL_LINK,
            s.FILES,

            t.ID AS team_id,
            t.NAME AS team_name,
            t.SPOC_ID,
            t.LEAD_EMAIL,
            t.LEAD_PHONE,
            t.MENTOR_NAME,
            t.MENTOR_EMAIL,

            u.NAME AS spoc_name,
            u.COLLEGE AS college_name
        FROM submissions s
        JOIN Team_List t ON s.TEAM_EMAIL = t.LEAD_EMAIL
        JOIN Users u ON t.LEAD_EMAIL = u.EMAIL
        WHERE s.PROBLEM_ID = ?
        `,
        [id]
    );

    res.send(data);
});

/* ====================== GET SUBMISSION BY ID ====================== */

const Get_submission_by_id = AsyncHandler(async (req, res) => {
    const { id } = req.params;

    const [result] = await connection.query(
        `
        SELECT
            s.ID AS submission_id,
            p.TITLE AS problem_title,
            s.SOL_TITLE AS submission_title,
            s.SOL_DESCRIPTION AS description,
            t.NAME AS team_name,
            t.SPOC_ID AS spoc_id,
            s.SUB_DATE AS submitted_date,
            s.FILES AS solution_document,
            u.COLLEGE AS college_name,

            s.MARK    AS total_mark,
            s.CP_MARK AS cp_mark,
            s.PS_MARK AS ps_mark,
            s.BV_MARK AS bv_mark,
            s.FP_MARK AS fp_mark,
            s.IN_MARK AS in_mark
        FROM submissions s
        JOIN problems p ON s.PROBLEM_ID = p.ID
        LEFT JOIN Team_List t ON s.TEAM_EMAIL = t.LEAD_EMAIL
        LEFT JOIN Users u ON t.LEAD_EMAIL = u.EMAIL
        WHERE s.ID = ?
        `,
        [id]
    );

    if (result.length === 0) {
        return res.status(404).json({ message: "Submission not found" });
    }

    res.status(200).json(result[0]);
});

/* ====================== ADD MARK ====================== */

const AddMarkToSolution = AsyncHandler(async (req, res) => {
    const { evaluation, subid } = req.body;
    const scores = evaluation;

    let sum = 0;
    scores.forEach(s => sum += s.value);

    const [cp, ps, bv, fp, inn] = scores.map(s => s.value);

    await connection.query(
        `
        UPDATE submissions
        SET CP_MARK = ?, PS_MARK = ?, BV_MARK = ?, FP_MARK = ?, IN_MARK = ?
        WHERE ID = ?
        `,
        [cp, ps, bv, fp, inn, subid]
    );

    const status = sum >= 60 ? "ACCEPTED" : "REJECTED";

    await connection.query(
        "UPDATE submissions SET STATUS = ? WHERE ID = ?",
        [status, subid]
    );
});

/* ====================== FETCH BY EMAIL ====================== */

const fetch_submissions_by_email = AsyncHandler(async (req, res) => {
    const { userEmail } = req.body;

    const [data] = await connection.query(
        "SELECT * FROM submissions WHERE TEAM_EMAIL = ?",
        [userEmail]
    );

    res.send(data);
});

/* ====================== CHECK STATUS ====================== */

const check_status_submission = AsyncHandler(async (req, res) => {
    const { teamEmail, problemId } = req.body;

    const [data] = await connection.query(
        `
        SELECT STATUS
        FROM submissions
        WHERE TEAM_EMAIL = ? AND PROBLEM_ID = ?
        ORDER BY ID DESC
        OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY
        `,
        [teamEmail, problemId]
    );

    if (data.length === 0) {
        return res.status(200).json({ status: "NO_SUBMISSION" });
    }

    res.status(200).json({ status: data[0].STATUS });
});

/* ====================== EXPORTS ====================== */

export {
    SubmitSolution,
    check_status_submission,
    Get_solution,
    Get_all_submissions,
    Get_submission_by_id,
    AddMarkToSolution,
    Get_submission_by_prob_id,
    fetch_submissions_by_email
};
