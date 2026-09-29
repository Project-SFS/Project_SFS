import fs from "fs";
import connection from "../database/db.js";
import AsyncHandler from "../utils/AsyncHandler.js";
import { notifyEvaluatorAssigned } from "../utils/notifications.js";

const Get_problems = AsyncHandler(async (req, res) => {
    const [problems] = await connection.query(`
        SELECT 
            p.*,
            u.EMAIL AS evaluator_email,
            (SELECT COUNT(*) FROM SolveForSakthi_Submissions s WHERE s.PROBLEM_ID = p.ID) AS submission_count, (SELECT COUNT(*) FROM SolveForSakthi_Team_Problems tp WHERE tp.PROBLEM_ID = p.ID AND tp.STATUS = 'ASSIGNED') AS assigned_team_count, (SELECT COUNT(*) FROM SolveForSakthi_Submissions s WHERE s.PROBLEM_ID = p.ID AND s.STATUS IN ('ACCEPTED', 'REJECTED')) AS evaluated_count
        FROM SolveForSakthi_Problems p
        LEFT JOIN SolveForSakthi_Users u 
            ON p.Evaluator_ID = u.ID
    `);

    res.status(200).json({ problems });
});


const Get_problem_by_id = AsyncHandler(async (req, res) => {
    const { id } = req.params;
    // validate id to be an integer to avoid SQL injection and invalid queries
    const parsedId = parseInt(id, 10);
    if (Number.isNaN(parsedId)) {
        return res.status(400).json({ message: 'Invalid problem id' });
    }

    // use parameterized query to prevent SQL injection
    const [problems] = await connection.query("SELECT p.*, (SELECT COUNT(*) FROM SolveForSakthi_Submissions s WHERE s.PROBLEM_ID = p.ID) AS submission_count, (SELECT COUNT(*) FROM SolveForSakthi_Team_Problems tp WHERE tp.PROBLEM_ID = p.ID AND tp.STATUS = 'ASSIGNED') AS assigned_team_count, (SELECT COUNT(*) FROM SolveForSakthi_Submissions s WHERE s.PROBLEM_ID = p.ID AND s.STATUS IN ('ACCEPTED', 'REJECTED')) AS evaluated_count FROM SolveForSakthi_Problems p WHERE p.ID = ?", [parsedId]);
    res.status(200).json({ problems });
})

const Post_problem = AsyncHandler(async (req, res) => {
    const { title, description, sub_date,category ,reference, evaluators } = req.body;
    if (!title || !sub_date) {
        return res.status(400).json({ message: 'Title and deadline are required' });
    }

    const dept = "CSE"; 
    const query = `INSERT INTO SolveForSakthi_Problems (TITLE, DESCRIPTION,SUB_DEADLINE, CATEGORY,DEPT,Reference, Evaluator_ID)
                   VALUES (?, ?, ?, ?, ?, ?, ?)`; 

    // evaluators may arrive as an id, an array of ids, or nothing; an evaluator creating a problem owns it
    let evaluatorId = Array.isArray(evaluators) ? evaluators[0] : evaluators;
    if (evaluatorId == null && req.user?.ROLE === "EVALUATOR") evaluatorId = req.user.ID;
    evaluatorId = evaluatorId != null && evaluatorId !== "" && Number.isInteger(Number(evaluatorId)) ? Number(evaluatorId) : null;

    const params = [title, description, sub_date, category, dept, reference ?? null, evaluatorId];

    const [result] = await connection.execute(query, params);
    if (evaluatorId) notifyEvaluatorAssigned(result.insertId);

    res.status(201).json({ result, ...req.body });
})


const Delete_problem = AsyncHandler(async (req, res) => {
    const { id } = req.body;
    // validate id
    if (!id) {
        return res.status(400).json({ message: 'Problem ID is required' });
    }

    const [problems] = await connection.query("SELECT ID FROM SolveForSakthi_Problems WHERE ID = ?", [id]);
    if (problems.length === 0) {
        return res.status(404).json({ message: 'Problem not found' });
    }

    // a problem's submissions (and their PDFs) go with it, so no orphaned rows are left behind
    const [submissions] = await connection.query("SELECT FILES FROM SolveForSakthi_Submissions WHERE PROBLEM_ID = ?", [id]);
    const [deleted] = await connection.query("DELETE FROM SolveForSakthi_Submissions WHERE PROBLEM_ID = ?", [id]);
    await connection.query("DELETE FROM SolveForSakthi_Team_Problems WHERE PROBLEM_ID = ?", [id]);
    await connection.execute("DELETE FROM SolveForSakthi_Problems WHERE ID = ?", [id]);
    submissions.filter((s) => s.FILES).forEach((s) => fs.unlink(s.FILES, () => {}));

    res.status(200).json({ message: 'Problem deleted successfully', deletedSubmissions: deleted.affectedRows });
})


const Get_assigned_problems = AsyncHandler(async (req, res) => {
    const { evaluatorId } = req.params;

    if (!evaluatorId) {
        return res.status(400).json({ message: 'Evaluator ID is required' });
    }

    const query = `SELECT p.*, (SELECT COUNT(*) FROM SolveForSakthi_Submissions s WHERE s.PROBLEM_ID = p.ID) AS submission_count, (SELECT COUNT(*) FROM SolveForSakthi_Team_Problems tp WHERE tp.PROBLEM_ID = p.ID AND tp.STATUS = 'ASSIGNED') AS assigned_team_count, (SELECT COUNT(*) FROM SolveForSakthi_Submissions s WHERE s.PROBLEM_ID = p.ID AND s.STATUS IN ('ACCEPTED', 'REJECTED')) AS evaluated_count FROM SolveForSakthi_Problems p WHERE p.Evaluator_ID = ?`;

    const [problems] = await connection.query(query, [evaluatorId]);
    res.status(200).json({ problems });
});

export { Get_problems, Get_problem_by_id, Post_problem, Delete_problem, Get_assigned_problems }