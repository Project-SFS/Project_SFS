import connection from "../database/db.js"
import { notifyTeamGraduated } from "./notifications.js"

// A team's graduation year is the highest graduation year of its members. Once that year has ended
// (e.g. 2029 -> from 1 January 2030, in APP_TIMEZONE) the team is archived:
//   - GRADUATED_AT / GRADUATION_YEAR are set, so the SPOC no longer sees or manages it
//   - the team login is closed (user STATUS = 'GRADUATED')
//   - the SPOC and every member are emailed
// Nothing is deleted: members, challenges, submissions, reviews and mails stay for the admin.
// Teams without graduation years (created before the field existed) never graduate automatically.

const timeZone = process.env.APP_TIMEZONE || "Asia/Kolkata"
export const currentYear = () => Number(new Date().toLocaleDateString("en-CA", { timeZone }).slice(0, 4))

// years a member may graduate in when a SPOC adds or edits a team
export const GRAD_YEAR_SPAN = 10
export const gradYearRange = () => ({ min: currentYear(), max: currentYear() + GRAD_YEAR_SPAN })

const runGraduation = async () => {
    const year = currentYear()
    const [teams] = await connection.query(`
        SELECT t.ID, t.NAME, t.LEAD_EMAIL, t.SPOC_ID, g.GRAD_YEAR
        FROM SolveForSakthi_Team_List t
        JOIN (SELECT Team_ID, MAX(GRAD_YEAR) AS GRAD_YEAR FROM SolveForSakthi_Team_Members_List GROUP BY Team_ID) g ON g.Team_ID = t.ID
        WHERE t.GRADUATED_AT IS NULL AND g.GRAD_YEAR IS NOT NULL AND g.GRAD_YEAR < ?`, [year])

    for (const team of teams) {
        // only the first run that archives the team sends the mails
        const [updated] = await connection.query(
            "UPDATE SolveForSakthi_Team_List SET GRADUATED_AT = SYSUTCDATETIME(), GRADUATION_YEAR = ? WHERE ID = ? AND GRADUATED_AT IS NULL",
            [team.GRAD_YEAR, team.ID]
        )
        if (updated.affectedRows === 0) continue
        if (team.LEAD_EMAIL) {
            await connection.query("UPDATE SolveForSakthi_Users SET STATUS = 'GRADUATED' WHERE EMAIL = ? AND ROLE = 'STUDENT'", [team.LEAD_EMAIL])
        }
        console.log(`Team ${team.ID} (${team.NAME}) graduated (final graduation year ${team.GRAD_YEAR}) and was archived`)
        notifyTeamGraduated(team.ID)
    }
    return teams.length
}

export { runGraduation }
