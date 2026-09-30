import connection from "../database/db.js";
import AsyncHandler from "../utils/AsyncHandler.js";
import { notifyAccountDecision } from "../utils/notifications.js";

// Pending SPOC and evaluator sign-ups, shown on the admin Approvals page
const Spoc_approve = AsyncHandler(async (req, res) => {
    const [data,error] = await connection.query("SELECT * FROM SolveForSakthi_Users WHERE STATUS='PENDING' AND ROLE IN ('SPOC', 'EVALUATOR')");
    res.status(200).json(data.map(({ PASSWORD, ...rest }) => rest))
})

// Approves or rejects one pending SPOC / evaluator. `id` is the user row (or just its ID).
const handleSpocApprove = AsyncHandler(async (req, res) => {
    const { id, approve } = req.body;
    const userId = parseInt(id?.ID ?? id, 10);
    if (Number.isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user id" });
    }

    const [data] = await connection.query(
        `UPDATE SolveForSakthi_Users SET STATUS = ? WHERE ID = ? AND STATUS = 'PENDING' AND ROLE IN ('SPOC', 'EVALUATOR')`,
        [approve ? "ACTIVE" : "REJECTED", userId]
    )
    if (data.affectedRows === 0) {
        return res.status(404).json({ message: "This request was already handled or no longer exists" });
    }
    notifyAccountDecision(userId, Boolean(approve))
    res.send(data)
})

export {Spoc_approve, handleSpocApprove}
