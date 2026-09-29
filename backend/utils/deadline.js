import connection from "../database/db.js"

const timeZone = process.env.APP_TIMEZONE || "Asia/Kolkata"

// YYYY-MM-DD in the contest's time zone; the container clock is UTC, which would date
// submissions made between 00:00 and 05:30 IST to the previous day
const today = () => new Date().toLocaleDateString("en-CA", { timeZone })

// Returns an error message when submissions to this problem are not allowed, otherwise null.
// The deadline day itself is still open.
const checkProblemOpen = async (problemId) => {
    const [rows] = await connection.query("SELECT SUB_DEADLINE FROM SolveForSakthi_Problems WHERE ID = ?", [problemId])
    if (rows.length === 0) return "Problem not found"

    const deadline = rows[0].SUB_DEADLINE
    if (deadline) {
        const lastDay = deadline instanceof Date ? deadline.toISOString().slice(0, 10) : String(deadline).slice(0, 10)
        if (today() > lastDay) return "The submission deadline for this problem has passed"
    }
    return null
}

export { today, checkProblemOpen }
