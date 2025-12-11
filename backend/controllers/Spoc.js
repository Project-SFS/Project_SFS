import connection from "../database/ms-sql.js";
import AsyncHandler from "../utils/AsyncHandler.js";

const Spoc_approve = AsyncHandler(async (req, res) => {
    const [data,error] = await connection.query("SELECT * FROM Users WHERE STATUS='PENDING' AND ROLE='SPOC'");
    res.status(200).json(data)
})

const handleSpocApprove = AsyncHandler(async (req, res) => {
    const { id, approve } = req.body;
    
    if (approve) {
        var [data, err] = await connection.query(`UPDATE Users SET STATUS='ACTIVE' WHERE ID=?`,[id.ID])
    } else {
        var [data, err] = await connection.query(`UPDATE Users SET STATUS='REJECTED' WHERE ID=?`, [id.ID])
    }
    res.send(data)
})

export {Spoc_approve, handleSpocApprove}