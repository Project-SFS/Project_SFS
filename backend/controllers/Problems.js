import fs from "fs";
import connection from "../database/db.js";
import AsyncHandler from "../utils/AsyncHandler.js";

const Get_problems = AsyncHandler(async (req, res) => {
    const [problems] = await connection.query(`
        SELECT 
            p.*,
            (SELECT COUNT(*) FROM SolveForSakthi_Submissions s WHERE s.PROBLEM_ID = p.ID) AS submission_count, (SELECT COUNT(*) FROM SolveForSakthi_Team_Problems tp WHERE tp.PROBLEM_ID = p.ID AND tp.STATUS = 'ASSIGNED') AS assigned_team_count, (SELECT COUNT(*) FROM SolveForSakthi_Submissions s WHERE s.PROBLEM_ID = p.ID AND s.STATUS IN ('ACCEPTED', 'REJECTED')) AS evaluated_count
        FROM SolveForSakthi_Problems p
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
    const { title, description, sub_date, category, reference } = req.body;
    if (!title || !sub_date) {
        return res.status(400).json({ message: 'Title and deadline are required' });
    }

    const dept = "CSE"; 
    // admins evaluate every problem's submissions, so a problem has no separate evaluator
    const query = `INSERT INTO SolveForSakthi_Problems (TITLE, DESCRIPTION,SUB_DEADLINE, CATEGORY,DEPT,Reference)
                   VALUES (?, ?, ?, ?, ?, ?)`; 
    const params = [title, description, sub_date, category, dept, reference ?? null];

    const [result] = await connection.execute(query, params);

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


export { Get_problems, Get_problem_by_id, Post_problem, Delete_problem }
