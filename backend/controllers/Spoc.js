import connection from "../database/mysql.js";
import AsyncHandler from "../utils/AsyncHandler.js";

/* ====================== FETCH PENDING SPOC ====================== */

const Spoc_approve = AsyncHandler(async (req, res) => {
    const [data] = await connection.query(
        "SELECT * FROM Users WHERE STATUS = 'PENDING' AND ROLE = 'SPOC'"
    );
    res.status(200).json(data);
});

/* ====================== HANDLE SPOC APPROVAL ====================== */

const handleSpocApprove = AsyncHandler(async (req, res) => {
    const { id, approve } = req.body;

    let query;
    if (approve) {
        query = "UPDATE Users SET STATUS = 'ACTIVE' WHERE ID = ?";
    } else {
        query = "UPDATE Users SET STATUS = 'REJECTED' WHERE ID = ?";
    }

    const [data] = await connection.query(query, [id.ID]);
    res.send(data);
});

/* ====================== EXPORTS ====================== */

export { Spoc_approve, handleSpocApprove };
