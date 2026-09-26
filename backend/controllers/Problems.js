import connection from "../database/mysql.js";
import AsyncHandler from "../utils/AsyncHandler.js";

const Get_problems = AsyncHandler(async (req, res) => {
    const [problems] = await connection.query(`
        SELECT 
            p.*,
            u.EMAIL AS evaluator_email
        FROM problems p
        LEFT JOIN Users u 
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
    const [problems] = await connection.query("SELECT * FROM problems WHERE ID = ?", [parsedId]);
    res.status(200).json({ problems });
})

const Post_problem = AsyncHandler(async (req, res) => {
    const { title, description, sub_date,category ,reference, evaluators } = req.body;
    console.log(sub_date);
    console.log(evaluators);
    
    
    const dept = "CSE"; 
    const query = `INSERT INTO problems (TITLE, DESCRIPTION,SUB_DEADLINE, CATEGORY,DEPT,Reference, Evaluator_ID)
                   VALUES (?, ?, ?, ?, ?, ?, ?)`; 

    // evaluators may arrive as an id, an array of ids, or nothing; an evaluator creating a problem owns it
    let evaluatorId = Array.isArray(evaluators) ? evaluators[0] : evaluators;
    if (evaluatorId == null && req.user?.ROLE === "EVALUATOR") evaluatorId = req.user.ID;
    evaluatorId = evaluatorId != null && evaluatorId !== "" && Number.isInteger(Number(evaluatorId)) ? Number(evaluatorId) : null;

    const params = [title, description, sub_date, category, dept, reference ?? null, evaluatorId];

    const [result] = await connection.execute(query, params);
    const problemId = result.insertId;

    // Handle Evaluators assignment
    if (evaluators && Array.isArray(evaluators) && evaluators.length > 0) {
        const evalValues = evaluators.map(evaluatorId => [problemId, evaluatorId]);
        const evalQuery = `INSERT INTO problem_evaluators (PROBLEM_ID, EVALUATOR_ID) VALUES ?`;
        try {
            await connection.query(evalQuery, [evalValues]);
        } catch (err) {
            console.error("Error inserting evaluators:", err);
        }
    }

    res.status(201).json({ result, ...req.body });
})


const Delete_problem = AsyncHandler(async (req, res) => {
    const { id } = req.body;
    // validate id
    if (!id) {
        return res.status(400).json({ message: 'Problem ID is required' });
    }

    const query = "DELETE FROM problems WHERE ID = ?";
    const [result] = await connection.execute(query, [id]);

    if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Problem not found' });
    }

    res.status(200).json({ message: 'Problem deleted successfully' });
})


const Get_assigned_problems = AsyncHandler(async (req, res) => {
    const { evaluatorId } = req.params;

    console.log(evaluatorId);
    

    if (!evaluatorId) {
        return res.status(400).json({ message: 'Evaluator ID is required' });
    }

    const query = `SELECT * FROM problems WHERE Evaluator_ID = ?`;

    try {
        const [problems] = await connection.query(query, [evaluatorId]);
        console.log(problems);
        
        res.status(200).json({ problems });
    } catch (error) {
        // Suppress "Table doesn't exist" error (errno 1146)
        if (error.errno === 1146) {
            // console.warn("Table problem_evaluators missing, returning empty list."); // Optional clean log
            return res.status(200).json({ problems: [] });
        }
        throw error; // Let AsyncHandler handle other errors
    }
});

export { Get_problems, Get_problem_by_id, Post_problem, Delete_problem, Get_assigned_problems }