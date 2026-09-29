import connection from "../database/db.js";
import AsyncHandler from "../utils/AsyncHandler.js";
import { loadTeamFor } from "../utils/teamAccess.js";
import { sendMail } from "../utils/mailer.js"
import { layout, escapeHtml } from "../utils/notifications.js"
import dotenv from "dotenv"
import { signup } from "./User_details.js";
dotenv.config()

const Add_Team_Members = AsyncHandler(async (req, res) => {
  const { Teamdata, mentorEmail, mentorName } = req.body;
  const { id } = req.params;
  // a SPOC creates teams only under their own account
  if (req.user.ROLE !== "ADMIN" && String(req.user.ID) !== String(id)) {
    return res.status(403).json({ message: "You can only create teams for your own college" });
  }
  
  
    // console.log(data.members)
    const TeamName = Teamdata.teamName;
    const TeamMemberData = Teamdata.members;
    let leademail;
  const [result] = await connection.query(`insert into SolveForSakthi_Team_List(NAME, SPOC_ID, MENTOR_NAME, MENTOR_EMAIL) VALUES (?,?,?,?)`,[TeamName, id,mentorName, mentorEmail])
    for (let i = 0; i < TeamMemberData.length; i++){
        let singledata = TeamMemberData[i];
        // console.log(singledata)
        if (singledata.role == "Team Lead") {
            await connection.query(`UPDATE SolveForSakthi_Team_List SET LEAD_EMAIL = ? WHERE ID = ?`,[singledata.email, result.insertId])
            await connection.query(`UPDATE SolveForSakthi_Team_List SET LEAD_PHONE = ? WHERE ID = ?`,[singledata.phone, result.insertId])
            leademail = singledata.email
        }
        const [res] = await connection.query(`insert into SolveForSakthi_Team_Members_List(ROLE, NAME, EMAIL, PHONE, GENDER, SPOC_ID, TEAM_ID) values (?,?,?,?,?,?,?)`,[singledata.role, singledata.name, singledata.email, singledata.phone, singledata.gender, id, result.insertId])

        const email = async () => {
            const info = await sendMail({
                to: `${singledata.email}`,
                subject: "You are registered for Solve For Sakthi",
                html: layout({
                heading: "Registration successful",
                intro: `Hello ${escapeHtml(singledata.name || "Participant")}, you have been registered for Solve For Sakthi ${new Date().getFullYear()} in team <b>${escapeHtml(TeamName)}</b>, led by ${escapeHtml(leademail || "your team lead")}. We wish you all the best!`,
                rows: [["Name", singledata.name], ["Role", singledata.role], ["Email", singledata.email], ["Phone", singledata.phone], ["Gender", singledata.gender]],
            })
, 
            });

            console.log("Message sent:", info.messageId);
        }

        try {
            await email()
        } catch (err) {
            console.error("Team member mail failed:", err.message)
        }
        // console.log(dev)
    }
  
    // signup()
  


    res.status(200).send(result.insertId)
    
})

const Update_team = async(req,res) => {
  const { team, id, mentorEmail, mentorName } = req.body;
  const { teamName, members } = team;
  if (!(await loadTeamFor(req, res, id, { manage: true }))) return;

  const [result] = await connection.query(
    `UPDATE SolveForSakthi_Team_List 
   SET NAME = ?, MENTOR_NAME = ?, MENTOR_EMAIL = ? 
   WHERE ID = ?`,
    [teamName, mentorName, mentorEmail, id]
  );

  for (const member of members) {
    const [result] = await connection.query("UPDATE SolveForSakthi_Team_Members_List SET NAME = ?, EMAIL = ?, PHONE = ?, GENDER = ? WHERE TEAM_ID = ? AND ROLE = ?", [member.name, member.email, member.phone, member.gender, id, member.role])
    
  
      
  }

  res.send("Updated")
  
  
}

export {Add_Team_Members, Update_team}