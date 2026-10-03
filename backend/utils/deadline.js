import connection from "../database/db.js"

const timeZone = process.env.APP_TIMEZONE || "Asia/Kolkata"

// YYYY-MM-DD in the contest's time zone; the container clock is UTC, which would date
// submissions made between 00:00 and 05:30 IST to the previous day
const today = () => new Date().toLocaleDateString("en-CA", { timeZone })

// There are no deadlines: a challenge takes solutions until an admin closes it ("Concept Received").
export const CHALLENGE_NOT_FOUND = "Challenge not found"
export const CHALLENGE_CLOSED = "This challenge is closed (Concept Received) and takes no new solutions"

// Returns an error message when solutions to this challenge are not allowed, otherwise null
const checkProblemOpen = async (problemId) => {
    const [rows] = await connection.query("SELECT IS_CLOSED FROM SolveForSakthi_Problems WHERE ID = ?", [problemId])
    if (rows.length === 0) return CHALLENGE_NOT_FOUND
    return rows[0].IS_CLOSED ? CHALLENGE_CLOSED : null
}

export { today, checkProblemOpen }
