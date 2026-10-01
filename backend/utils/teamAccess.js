import connection from "../database/db.js"

// Who may see or change a team:
//   ADMIN      - every team (view + manage)
//   SPOC       - only the teams they created and that have not graduated (view + manage)
//   STUDENT    - only the team they lead (view only)
// Problem statements themselves are public; team details, members and submissions are not.

const role = (req) => String(req.user?.ROLE || "").toUpperCase()
const sameEmail = (a, b) => String(a || "").trim().toLowerCase() === String(b || "").trim().toLowerCase()

const canViewTeam = (req, team) => {
    switch (role(req)) {
        case "ADMIN":
            return true
        case "SPOC":
            return team.SPOC_ID === req.user.ID && !team.GRADUATED_AT
        case "STUDENT":
            return sameEmail(team.LEAD_EMAIL, req.user.EMAIL)
        default:
            return false
    }
}

// graduated teams are read-only for everyone (records kept for the admin)
const canManageTeam = (req, team) => !team.GRADUATED_AT && (role(req) === "ADMIN" || (role(req) === "SPOC" && team.SPOC_ID === req.user.ID))

// Loads a team and answers 404/403 itself when it is missing or off-limits; returns the team or null
const loadTeamFor = async (req, res, teamId, { manage = false } = {}) => {
    const [rows] = await connection.query("SELECT * FROM SolveForSakthi_Team_List WHERE ID = ?", [teamId])
    const team = rows[0]
    if (!team) {
        res.status(404).json({ message: "Team not found" })
        return null
    }
    if (!(manage ? canManageTeam(req, team) : canViewTeam(req, team))) {
        res.status(403).json({ message: "You do not have access to this team" })
        return null
    }
    return team
}

// Can the caller see the submissions of the team led by this email?
const canViewTeamOfLead = async (req, leadEmail) => {
    if (role(req) === "ADMIN") return true
    if (role(req) === "STUDENT") return sameEmail(leadEmail, req.user.EMAIL)
    if (role(req) === "SPOC") {
        const [rows] = await connection.query("SELECT TOP 1 ID FROM SolveForSakthi_Team_List WHERE LEAD_EMAIL = ? AND SPOC_ID = ? AND GRADUATED_AT IS NULL", [leadEmail, req.user.ID])
        return rows.length > 0
    }
    return false
}

export { canViewTeam, canManageTeam, loadTeamFor, canViewTeamOfLead }
