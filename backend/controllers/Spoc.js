import connection from "../database/db.js";
import AsyncHandler from "../utils/AsyncHandler.js";
import { notifyAccountDecision } from "../utils/notifications.js";

const Spoc_approve = AsyncHandler(async (req, res) => {
    const [data,error] = await connection.query("SELECT * FROM SolveForSakthi_Users WHERE STATUS='PENDING' AND ROLE IN ('SPOC', 'EVALUATOR')");
    res.status(200).json(data.map(({ PASSWORD, ...rest }) => rest))
})

const handleSpocApprove = AsyncHandler(async (req, res) => {
    const { id, approve } = req.body;
    
    if (approve) {
        var [data, err] = await connection.query(`UPDATE SolveForSakthi_Users SET STATUS='ACTIVE' WHERE ID=?`,[id.ID])
    } else {
        var [data, err] = await connection.query(`UPDATE SolveForSakthi_Users SET STATUS='REJECTED' WHERE ID=?`, [id.ID])
    }
    if (data.affectedRows > 0) notifyAccountDecision(id.ID, Boolean(approve))
    res.send(data)
})

export {Spoc_approve, handleSpocApprove}