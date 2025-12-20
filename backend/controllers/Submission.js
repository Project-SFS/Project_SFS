import AsyncHandler from "../utils/AsyncHandler.js";
import connection from "../database/mysql.js";

const SubmitSolution = AsyncHandler(async (req, res) => {
    const { problemId, teamId, SOL_LINK, SOL_TITLE = null, SOL_DESCRIPTION = null } = req.body;
    if (!problemId || !teamId || !SOL_LINK) {
        return res.status(400).json({ message: "problemId, teamId and SOL_LINK are required" });
    }

    const [teamExists] = await connection.query('SELECT ID FROM Team_List WHERE ID = ?', [teamId]);
    if (teamExists.length === 0) {
        return res.status(404).json({ message: "Team not found" });
    }

    const SUB_DATE = new Date().toISOString().slice(0, 10);
    const status = "PENDING";
    const query = `INSERT INTO submissions (PROBLEM_ID, TEAM_ID, SOL_TITLE, SOL_DESCRIPTION, SUB_DATE, STATUS, SOL_LINK) VALUES (?,?,?,?,?,?,?)`;
    const values = [problemId, teamId, SOL_TITLE, SOL_DESCRIPTION, SUB_DATE, status, SOL_LINK];

    const [result] = await connection.query(query, values);

    res.status(201).json({ message: "Solution submitted successfully", submissionId: result.insertId });
});


const Get_solution = AsyncHandler(async (req, res) => {
    const { teamId } = req.params;
    const [result] = await connection.query(`SELECT * FROM submissions WHERE TEAM_ID = ?`, [teamId]);
    res.status(200).json(result);
});

const Get_all_submissions = AsyncHandler(async (req, res) => {
    const { problemId, page = 1, limit = 10 } = req.query; // Default to page 1, 10 items per page
    const offset = (page - 1) * limit;

    let query = `
        select * from submissions
    `;
    const params = [];

    if (problemId) {
        query += ` WHERE PROBLEM_ID = ?`;
        params.push(problemId);
    }

    // Get total count for pagination
    const countQuery = `SELECT COUNT(*) as total FROM (${query}) as subquery`;
    const [totalResult] = await connection.query(countQuery, params);
    const total = totalResult[0].total;

    // Add pagination to the main query
    query += ` ORDER BY SUB_DATE DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const [result] = await connection.query(query, params);

    res.status(200).json({
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
        submissions: result
    });
});

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
  JOIN Team_List t
      ON s.TEAM_EMAIL = t.LEAD_EMAIL
  JOIN Users u
      ON t.LEAD_EMAIL = u.EMAIL
  WHERE s.PROBLEM_ID = ?
  `,
        [id]
    );
    console.log(id);
    

    console.log(data);



    
    res.send(data)
})

const Get_submission_by_id = AsyncHandler(async (req, res) => {
    const { id } = req.params;
    const query = `
SELECT
    s.ID AS submission_id,
    p.TITLE AS problem_title,
    s.SOL_TITLE AS submission_title,
    s.SOL_DESCRIPTION AS description,
    t.NAME AS team_name,
    t.SPOC_ID AS spoc_id,
    s.SUB_DATE AS submitted_date,
    s.FILES AS solution_document,
    u.COLLEGE AS college_name
FROM submissions s
JOIN problems p ON s.PROBLEM_ID = p.ID
LEFT JOIN Team_List t ON s.TEAM_EMAIL = t.LEAD_EMAIL
LEFT JOIN Users u ON t.LEAD_EMAIL = u.EMAIL
WHERE s.ID = ?
`;

    const [result] = await connection.query(query, [id]);

    if (result.length === 0) {
        return res.status(404).json({ message: "Submission not found" });
    }

    res.status(200).json(result[0]);
});

export { SubmitSolution, Get_solution, Get_all_submissions, Get_submission_by_id, Get_submission_by_prob_id };