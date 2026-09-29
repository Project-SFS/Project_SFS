import connection from "../database/db.js";
import AsyncHandler from "../utils/AsyncHandler.js";
import { loadTeamFor, canViewTeamOfLead } from "../utils/teamAccess.js";

const Fetch_Teams = AsyncHandler(async (req, res) => {
    // console.log(req.params);
    
    const { id } = req.params;
    if (req.user.ROLE !== "ADMIN" && String(req.user.ID) !== String(id)) {
        return res.status(403).json({ message: "You can only view your own teams" })
    }
    // SUBMISSION_COUNT / SUBMITTED feed the dashboard's "submitted" counters
    const [result] = await connection.query(`
        select t.*,
               (select count(*) from SolveForSakthi_Submissions s where s.TEAM_EMAIL = t.LEAD_EMAIL) as SUBMISSION_COUNT,
               case when exists (select 1 from SolveForSakthi_Submissions s where s.TEAM_EMAIL = t.LEAD_EMAIL) then 1 else 0 end as SUBMITTED
        from SolveForSakthi_Team_List t WHERE t.SPOC_ID = ?`, [id])
    
    res.send(result)
})

const Fetch_Team_Members = AsyncHandler(async (req, res) => {
    const { id } = req.body;
    // console.log(id)
    const parsedId = parseInt(id, 10);
    if (Number.isNaN(parsedId)) {
        return res.status(400).json({ message: 'Invalid team id' });
    }
    if (!(await loadTeamFor(req, res, parsedId))) return;

    // use parameterized query to avoid SQL injection
    const [result, err1] = await connection.query("select * from SolveForSakthi_Team_Members_List where Team_ID = ?", [parsedId]);
    const [mentor, err2] = await connection.query("select MENTOR_NAME, MENTOR_EMAIL from SolveForSakthi_Team_List where ID = ?", [parsedId]);

    // console.log(result)
    res.json({result : result, mentor:mentor})
})

const Delete_team = AsyncHandler(async (req, res) => {
    const { id } = req.body;
    if (!(await loadTeamFor(req, res, id, { manage: true }))) return;
    await connection.query("DELETE FROM SolveForSakthi_Team_Problems WHERE TEAM_ID = ?", [id])
    await connection.query("DELETE FROM SolveForSakthi_Team_Members_List WHERE Team_ID = ?", [id])
    const [result] = await connection.query("DELETE FROM SolveForSakthi_Team_List WHERE ID = ?", [id])
    res.send(result)
})

const Fetch_Team_For_Students = AsyncHandler(async (req, res) => {
    const { id } = req.body;
    const team = await loadTeamFor(req, res, id);
    if (!team) return;
    res.send([team])
})

const fetch_team_id_email = AsyncHandler(async (req, res) => {
    // a student can only look up their own team
    const email = req.user.ROLE === "STUDENT" ? req.user.EMAIL : req.body.email;
    if (!(await canViewTeamOfLead(req, email))) {
        return res.status(403).json({ message: "You do not have access to this team" })
    }
    const [data, extra] = await connection.query("SELECT ID FROM SolveForSakthi_Team_List WHERE LEAD_EMAIL = ?", [email])
    
    res.send(data)
})

export { Fetch_Teams, Fetch_Team_Members, Delete_team, Fetch_Team_For_Students, fetch_team_id_email }