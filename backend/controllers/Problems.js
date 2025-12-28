import connection from "../database/mysql.js";
import AsyncHandler from "../utils/AsyncHandler.js";

/* ====================== GET ALL PROBLEMS ====================== */

const Get_problems = AsyncHandler(async (req, res) => {
    const [problems] = await connection.query(`
        SELECT 
            p.*,
            u.EMAIL AS evaluator_email
        FROM problems p
        JOIN Users u 
            ON p.Evaluator_ID = u.ID
    `);

    res.status(200).json({ problems });
});

/* ====================== GET PROBLEM BY ID ====================== */

const Get_problem_by_id = AsyncHandler(async (req, res) => {
    const { id } = req.params;
    const parsedId = parseInt(id, 10);

    if (Number.isNaN(parsedId)) {
        return res.status(400).json({ message: "Invalid problem id" });
    }

    const [problems] = await connection.query(
        "SELECT * FROM problems WHERE ID = ?",
        [parsedId]
    );

    res.status(200).json({ problems });
});

/* ====================== POST PROBLEM ====================== */

const Post_problem = AsyncHandler(async (req, res) => {
    const { title, description, sub_date, category, reference, evaluators } = req.body;

   
    

    const dept = "CSE";

    /* ---------- INSERT PROBLEM (MSSQL WAY) ---------- */
    const [rows] = await connection.query(
        `
        INSERT INTO problems
        (TITLE, DESCRIPTION, SUB_DEADLINE, CATEGORY, DEPT, Reference, Evaluator_ID)
        OUTPUT INSERTED.ID AS problemId
        VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        [title, description, sub_date, category, dept, reference, evaluators]
    );
    
    

    const problemId = rows[0].problemId;

    /* ---------- ASSIGN EVALUATORS ---------- */
    // if (Array.isArray(evaluators) && evaluators.length > 0) {
    //     for (const evaluatorId of evaluators) {
    //         await connection.query(
    //             `
    //             INSERT INTO problem_evaluators (PROBLEM_ID, EVALUATOR_ID)
    //             VALUES (?, ?)
    //             `,
    //             [problemId, evaluatorId]
    //         );
    //     }
    // }

    res.status(201).json({ problemId, ...req.body });
});

/* ====================== DELETE PROBLEM ====================== */

const Delete_problem = AsyncHandler(async (req, res) => {
    const { id } = req.body;

    if (!id) {
        return res.status(400).json({ message: "Problem ID is required" });
    }

    const [existing] = await connection.query(
        "SELECT ID FROM problems WHERE ID = ?",
        [id]
    );

    if (existing.length === 0) {
        return res.status(404).json({ message: "Problem not found" });
    }

    await connection.query(
        "DELETE FROM problems WHERE ID = ?",
        [id]
    );

    res.status(200).json({ message: "Problem deleted successfully" });
});

/* ====================== GET ASSIGNED PROBLEMS ====================== */

const Get_assigned_problems = AsyncHandler(async (req, res) => {
    const { evaluatorId } = req.params;

    if (!evaluatorId) {
        return res.status(400).json({ message: "Evaluator ID is required" });
    }

    const [problems] = await connection.query(
        "SELECT * FROM problems WHERE Evaluator_ID = ?",
        [evaluatorId]
    );

    res.status(200).json({ problems });
});

/* ====================== EXPORTS ====================== */

export {
    Get_problems,
    Get_problem_by_id,
    Post_problem,
    Delete_problem,
    Get_assigned_problems
};
