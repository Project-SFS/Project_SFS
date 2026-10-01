import connection from "../database/db.js"
import { today } from "./deadline.js"
import { notifyDeadlineReminder } from "./notifications.js"

// Teams with an assigned problem whose deadline is 2 days away or less (and not passed) get one reminder
// email for that deadline. Teams that graduated or whose solution is already approved / rejected are skipped.
// Each reminder is recorded, so it is sent once; moving the deadline makes a new reminder possible.
const REMIND_DAYS = 2
const DAY_MS = 24 * 60 * 60 * 1000

const runDeadlineReminders = async () => {
    const todayStr = today()
    const [rows] = await connection.query(`
        SELECT tp.TEAM_ID, tp.PROBLEM_ID, t.NAME AS TEAM_NAME, t.LEAD_EMAIL, p.TITLE, p.SUB_DEADLINE,
               (SELECT TOP 1 s.STATUS FROM SolveForSakthi_Submissions s
                WHERE s.TEAM_EMAIL = t.LEAD_EMAIL AND s.PROBLEM_ID = p.ID ORDER BY s.ID DESC) AS SUBMISSION_STATUS
        FROM SolveForSakthi_Team_Problems tp
        JOIN SolveForSakthi_Team_List t ON t.ID = tp.TEAM_ID
        JOIN SolveForSakthi_Problems p ON p.ID = tp.PROBLEM_ID
        WHERE tp.STATUS = 'ASSIGNED' AND t.GRADUATED_AT IS NULL AND t.LEAD_EMAIL IS NOT NULL
          AND p.SUB_DEADLINE IS NOT NULL
          AND p.SUB_DEADLINE >= CAST(? AS DATE) AND p.SUB_DEADLINE <= DATEADD(DAY, ?, CAST(? AS DATE))
          AND NOT EXISTS (SELECT 1 FROM SolveForSakthi_Deadline_Reminders r
                          WHERE r.TEAM_ID = tp.TEAM_ID AND r.PROBLEM_ID = tp.PROBLEM_ID AND r.DEADLINE = p.SUB_DEADLINE)`,
        [todayStr, REMIND_DAYS, todayStr])

    let sent = 0
    for (const row of rows) {
        if (["APPROVED", "REJECTED", "ACCEPTED"].includes(row.SUBMISSION_STATUS)) continue
        const deadline = row.SUB_DEADLINE instanceof Date ? row.SUB_DEADLINE.toISOString().slice(0, 10) : String(row.SUB_DEADLINE).slice(0, 10)
        // record first: a second run (or a second server) cannot send the same reminder again
        try {
            await connection.query(
                "INSERT INTO SolveForSakthi_Deadline_Reminders (TEAM_ID, PROBLEM_ID, DEADLINE, SENT_AT) VALUES (?, ?, ?, SYSUTCDATETIME())",
                [row.TEAM_ID, row.PROBLEM_ID, deadline]
            )
        } catch {
            continue // already recorded
        }
        notifyDeadlineReminder({
            teamName: row.TEAM_NAME,
            leadEmail: row.LEAD_EMAIL,
            problemId: row.PROBLEM_ID,
            title: row.TITLE,
            deadline,
            daysLeft: Math.round((new Date(deadline) - new Date(todayStr)) / DAY_MS),
            submissionStatus: row.SUBMISSION_STATUS,
        })
        sent++
    }
    if (sent) console.log(`Deadline reminders sent: ${sent}`)
    return sent
}

export { runDeadlineReminders }
