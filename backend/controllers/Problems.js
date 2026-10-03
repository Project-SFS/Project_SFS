import fs from "fs";
import connection from "../database/db.js";
import AsyncHandler from "../utils/AsyncHandler.js";
import { insertProblem } from "./ProblemImport.js";
import { filePathsOf, unlinkAll } from "../utils/submissionFiles.js";
import { parseCategory } from "../utils/categories.js";
import { notifyProblemsPublished } from "../utils/notifications.js";

// Challenges are public, but who created / closed them (admin emails) is only for admins.
// There are no deadlines: a challenge is open until an admin closes it ("Concept Received").
const withoutCreatorForPublic = (req, problem) => {
    const row = { ...problem, IS_CLOSED: Boolean(problem.IS_CLOSED) };
    if (req.user?.ROLE === "ADMIN") return row;
    const { created_by_name, created_by_email, CREATED_BY, CLOSED_BY, closed_by_email, ...rest } = row;
    return rest;
};

const Get_problems = AsyncHandler(async (req, res) => {
    const [problems] = await connection.query(`
        SELECT 
            p.*,
            creator.NAME AS created_by_name, creator.EMAIL AS created_by_email,
            (SELECT COUNT(*) FROM SolveForSakthi_Submissions s WHERE s.PROBLEM_ID = p.ID) AS submission_count, (SELECT COUNT(DISTINCT s.TEAM_EMAIL) FROM SolveForSakthi_Submissions s WHERE s.PROBLEM_ID = p.ID) AS team_count, closer.EMAIL AS closed_by_email, (SELECT COUNT(*) FROM SolveForSakthi_Submissions s WHERE s.PROBLEM_ID = p.ID AND s.STATUS <> 'PENDING') AS evaluated_count
        FROM SolveForSakthi_Problems p
        LEFT JOIN SolveForSakthi_Users creator ON creator.ID = p.CREATED_BY
        LEFT JOIN SolveForSakthi_Users closer ON closer.ID = p.CLOSED_BY
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
    const [problems] = await connection.query(`SELECT p.*, creator.NAME AS created_by_name, creator.EMAIL AS created_by_email, (SELECT COUNT(*) FROM SolveForSakthi_Submissions s WHERE s.PROBLEM_ID = p.ID) AS submission_count, (SELECT COUNT(DISTINCT s.TEAM_EMAIL) FROM SolveForSakthi_Submissions s WHERE s.PROBLEM_ID = p.ID) AS team_count, closer.EMAIL AS closed_by_email, (SELECT COUNT(*) FROM SolveForSakthi_Submissions s WHERE s.PROBLEM_ID = p.ID AND s.STATUS <> 'PENDING') AS evaluated_count FROM SolveForSakthi_Problems p LEFT JOIN SolveForSakthi_Users creator ON creator.ID = p.CREATED_BY LEFT JOIN SolveForSakthi_Users closer ON closer.ID = p.CLOSED_BY WHERE p.ID = ?`, [parsedId]);
    res.status(200).json({ problems: problems.map((p) => withoutCreatorForPublic(req, p)) });
})

const Post_problem = AsyncHandler(async (req, res) => {
    const { title, description, category, domain, outcomes, requirements, technology } = req.body;
    if (!title || !String(title).trim()) {
        return res.status(400).json({ message: 'The challenge title is required' });
    }
    if (String(title).trim().length > 300) {
        return res.status(400).json({ message: 'The title can be at most 300 characters' });
    }
    if (!parseCategory(category)) {
        return res.status(400).json({ message: 'Choose a category: Software, Hardware or Combined' });
    }
    const text = (value) => (value == null ? null : String(value).trim() || null);

    // the creating admin and the time are recorded so the admin panel can show who added it
    const insertId = await insertProblem({
        title: String(title).trim(), description: text(description), deadline: null, category: parseCategory(category),
        domain: text(domain), outcomes: text(outcomes), requirements: text(requirements), technology: text(technology),
    }, req.user.ID);

    // SPOCs and the teams interested in this category are told about the new challenge
    notifyProblemsPublished([insertId]);
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
    const [submissions] = await connection.query("SELECT ID, FILES FROM SolveForSakthi_Submissions WHERE PROBLEM_ID = ?", [id]);
    const storedPaths = await filePathsOf(submissions.map((s) => s.ID));
    await connection.query("DELETE FROM SolveForSakthi_Submission_Reviews WHERE SUBMISSION_ID IN (SELECT ID FROM SolveForSakthi_Submissions WHERE PROBLEM_ID = ?)", [id]);
    await connection.query("DELETE FROM SolveForSakthi_Submission_Files WHERE SUBMISSION_ID IN (SELECT ID FROM SolveForSakthi_Submissions WHERE PROBLEM_ID = ?)", [id]);
    const [deleted] = await connection.query("DELETE FROM SolveForSakthi_Submissions WHERE PROBLEM_ID = ?", [id]);
    await connection.query("DELETE FROM SolveForSakthi_Team_Problems WHERE PROBLEM_ID = ?", [id]);
    await connection.execute("DELETE FROM SolveForSakthi_Problems WHERE ID = ?", [id]);
    unlinkAll([...new Set([...storedPaths, ...submissions.map((s) => s.FILES)])]);

    res.status(200).json({ message: 'Problem deleted successfully', deletedSubmissions: deleted.affectedRows });
})


// Admin edits every field of a challenge
const Update_problem = AsyncHandler(async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ message: "Invalid problem id" });
    const { title, description, category, domain, outcomes, requirements, technology } = req.body;
    if (!title || !String(title).trim()) {
        return res.status(400).json({ message: "The challenge title is required" });
    }
    if (String(title).trim().length > 300) {
        return res.status(400).json({ message: "The title can be at most 300 characters" });
    }
    if (!parseCategory(category)) {
        return res.status(400).json({ message: "Choose a category: Software, Hardware or Combined" });
    }
    const [rows] = await connection.query("SELECT ID FROM SolveForSakthi_Problems WHERE ID = ?", [id]);
    if (!rows[0]) return res.status(404).json({ message: "Challenge not found" });
    const text = (value) => (value == null ? null : String(value).trim() || null);
    const dom = text(domain);

    await connection.query(
        `UPDATE SolveForSakthi_Problems
         SET TITLE = ?, DESCRIPTION = ?, CATEGORY = ?, DEPT = ?, DOMAIN = ?,
             EXPECTED_OUTCOMES = ?, REQUIREMENTS = ?, TECHNOLOGY = ?
         WHERE ID = ?`,
        [String(title).trim(), text(description), parseCategory(category), (dom || "CSE").slice(0, 50), dom,
            text(outcomes), text(requirements), text(technology), id]
    );
    res.json({ message: "Challenge updated" });
});

// POST /problems/:id/close { closed: true | false } - an admin closes a challenge ("Concept Received": no new
// solutions; revisions that were asked for can still come in) or opens it again
const Close_problem = AsyncHandler(async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ message: "Invalid challenge id" });
    const closed = req.body?.closed !== false;
    const [result] = await connection.query(
        closed
            ? "UPDATE SolveForSakthi_Problems SET IS_CLOSED = 1, CLOSED_AT = SYSUTCDATETIME(), CLOSED_BY = ? WHERE ID = ?"
            : "UPDATE SolveForSakthi_Problems SET IS_CLOSED = 0, CLOSED_AT = NULL, CLOSED_BY = NULL WHERE ID = ?",
        closed ? [req.user.ID, id] : [id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: "Challenge not found" });
    res.json({ message: closed ? "Challenge closed: it now shows as Concept Received" : "Challenge opened again", closed });
});

export { Get_problems, Get_problem_by_id, Post_problem, Delete_problem, Update_problem, Close_problem }
