import fs from "fs";
import connection from "../database/db.js";
import AsyncHandler from "../utils/AsyncHandler.js";
import { insertProblem } from "./ProblemImport.js";
import { notifyDeadlineChanged } from "../utils/notifications.js";

// Problem statements are public, but who created them (an admin's name and email) is only for admins
const withoutCreatorForPublic = (req, problem) => {
    if (req.user?.ROLE === "ADMIN") return problem;
    const { created_by_name, created_by_email, CREATED_BY, ...rest } = problem;
    return rest;
};

const Get_problems = AsyncHandler(async (req, res) => {
    const [problems] = await connection.query(`
        SELECT 
            p.*,
            creator.NAME AS created_by_name, creator.EMAIL AS created_by_email,
            (SELECT COUNT(*) FROM SolveForSakthi_Submissions s WHERE s.PROBLEM_ID = p.ID) AS submission_count, (SELECT COUNT(*) FROM SolveForSakthi_Team_Problems tp WHERE tp.PROBLEM_ID = p.ID AND tp.STATUS = 'ASSIGNED') AS assigned_team_count, (SELECT COUNT(*) FROM SolveForSakthi_Submissions s WHERE s.PROBLEM_ID = p.ID AND s.STATUS <> 'PENDING') AS evaluated_count
        FROM SolveForSakthi_Problems p
        LEFT JOIN SolveForSakthi_Users creator ON creator.ID = p.CREATED_BY
    `);

    res.status(200).json({ problems: problems.map((p) => withoutCreatorForPublic(req, p)) });
});


const Get_problem_by_id = AsyncHandler(async (req, res) => {
    const { id } = req.params;
    // validate id to be an integer to avoid SQL injection and invalid queries
    const parsedId = parseInt(id, 10);
    if (Number.isNaN(parsedId)) {
        return res.status(400).json({ message: 'Invalid problem id' });
    }

    // use parameterized query to prevent SQL injection
    const [problems] = await connection.query(`SELECT p.*, creator.NAME AS created_by_name, creator.EMAIL AS created_by_email, (SELECT COUNT(*) FROM SolveForSakthi_Submissions s WHERE s.PROBLEM_ID = p.ID) AS submission_count, (SELECT COUNT(*) FROM SolveForSakthi_Team_Problems tp WHERE tp.PROBLEM_ID = p.ID AND tp.STATUS = 'ASSIGNED') AS assigned_team_count, (SELECT COUNT(*) FROM SolveForSakthi_Submissions s WHERE s.PROBLEM_ID = p.ID AND s.STATUS <> 'PENDING') AS evaluated_count FROM SolveForSakthi_Problems p LEFT JOIN SolveForSakthi_Users creator ON creator.ID = p.CREATED_BY WHERE p.ID = ?`, [parsedId]);
    res.status(200).json({ problems: problems.map((p) => withoutCreatorForPublic(req, p)) });
})

const Post_problem = AsyncHandler(async (req, res) => {
    const { title, description, sub_date, category, domain, outcomes, requirements, technology } = req.body;
    if (!title || !sub_date) {
        return res.status(400).json({ message: 'Title and deadline are required' });
    }
    if (String(title).trim().length > 300) {
        return res.status(400).json({ message: 'The title can be at most 300 characters' });
    }
    const text = (value) => (value == null ? null : String(value).trim() || null);

    // the creating admin and the time are recorded so the admin panel can show who added it
    const insertId = await insertProblem({
        title: String(title).trim(), description: text(description), deadline: sub_date, category: text(category),
        domain: text(domain), outcomes: text(outcomes), requirements: text(requirements), technology: text(technology),
    }, req.user.ID);

    res.status(201).json({ result: { insertId, affectedRows: 1 }, ...req.body });
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
    await connection.query("DELETE FROM SolveForSakthi_Submission_Reviews WHERE SUBMISSION_ID IN (SELECT ID FROM SolveForSakthi_Submissions WHERE PROBLEM_ID = ?)", [id]);
    const [deleted] = await connection.query("DELETE FROM SolveForSakthi_Submissions WHERE PROBLEM_ID = ?", [id]);
    await connection.query("DELETE FROM SolveForSakthi_Team_Problems WHERE PROBLEM_ID = ?", [id]);
    await connection.execute("DELETE FROM SolveForSakthi_Problems WHERE ID = ?", [id]);
    submissions.filter((s) => s.FILES).forEach((s) => fs.unlink(s.FILES, () => {}));

    res.status(200).json({ message: 'Problem deleted successfully', deletedSubmissions: deleted.affectedRows });
})


// Admin edits every field of a problem statement. When the deadline moves, each assigned team lead is
// emailed and their SPOCs get a separate email; a new deadline also gets its own 2-day reminder.
const toDay = (value) => (value instanceof Date ? value.toISOString().slice(0, 10) : value ? String(value).slice(0, 10) : null);
const Update_problem = AsyncHandler(async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ message: "Invalid problem id" });
    const { title, description, sub_date, category, domain, outcomes, requirements, technology } = req.body;
    if (!title || !String(title).trim() || !sub_date) {
        return res.status(400).json({ message: "Title and deadline are required" });
    }
    if (String(title).trim().length > 300) {
        return res.status(400).json({ message: "The title can be at most 300 characters" });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(sub_date)) || Number.isNaN(new Date(sub_date).getTime())) {
        return res.status(400).json({ message: "Choose a valid deadline" });
    }
    const [rows] = await connection.query("SELECT SUB_DEADLINE FROM SolveForSakthi_Problems WHERE ID = ?", [id]);
    if (!rows[0]) return res.status(404).json({ message: "Problem not found" });
    const oldDeadline = toDay(rows[0].SUB_DEADLINE);
    const text = (value) => (value == null ? null : String(value).trim() || null);
    const dom = text(domain);

    await connection.query(
        `UPDATE SolveForSakthi_Problems
         SET TITLE = ?, DESCRIPTION = ?, SUB_DEADLINE = ?, CATEGORY = ?, DEPT = ?, DOMAIN = ?,
             EXPECTED_OUTCOMES = ?, REQUIREMENTS = ?, TECHNOLOGY = ?
         WHERE ID = ?`,
        [String(title).trim(), text(description), sub_date, text(category), (dom || "CSE").slice(0, 50), dom,
            text(outcomes), text(requirements), text(technology), id]
    );

    const deadlineChanged = oldDeadline !== sub_date;
    if (deadlineChanged) notifyDeadlineChanged(id, oldDeadline, sub_date);
    res.json({ message: "Problem statement updated", deadlineChanged });
});

export { Get_problems, Get_problem_by_id, Post_problem, Delete_problem, Update_problem }
