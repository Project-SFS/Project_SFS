import connection from "../database/db.js";
import AsyncHandler from "../utils/AsyncHandler.js";
import { loadTeamFor } from "../utils/teamAccess.js";
import { sendMail } from "../utils/mailer.js"
import { layout, escapeHtml } from "../utils/notifications.js"
import dotenv from "dotenv"
import { signup } from "./User_details.js";
import { gradYearRange } from "../utils/graduation.js";

// Every member needs a graduation year between this year and a few years ahead; returns an error message or null
const gradYearError = (members) => {
  const { min, max } = gradYearRange();
  for (const m of members || []) {
    const year = Number(m.gradYear);
    if (!Number.isInteger(year) || year < min || year > max) {
      return `Choose a graduation year between ${min} and ${max} for ${m.name || m.role || "every member"}`;
    }
  }
  return null;
};
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
    const yearError = gradYearError(TeamMemberData);
    if (yearError) return res.status(400).json({ message: yearError });
    let leademail;
  const [result] = await connection.query(`insert into SolveForSakthi_Team_List(NAME, SPOC_ID, MENTOR_NAME, MENTOR_EMAIL, CREATED_AT) VALUES (?,?,?,?, SYSUTCDATETIME())`,[TeamName, id,mentorName, mentorEmail])
    for (let i = 0; i < TeamMemberData.length; i++){
        let singledata = TeamMemberData[i];
        // console.log(singledata)
        if (singledata.role == "Team Lead") {
            await connection.query(`UPDATE SolveForSakthi_Team_List SET LEAD_EMAIL = ? WHERE ID = ?`,[singledata.email, result.insertId])
            await connection.query(`UPDATE SolveForSakthi_Team_List SET LEAD_PHONE = ? WHERE ID = ?`,[singledata.phone, result.insertId])
            leademail = singledata.email
        }
        const [res] = await connection.query(`insert into SolveForSakthi_Team_Members_List(ROLE, NAME, EMAIL, PHONE, GENDER, GRAD_YEAR, SPOC_ID, TEAM_ID) values (?,?,?,?,?,?,?,?)`,[singledata.role, singledata.name, singledata.email, singledata.phone, singledata.gender, Number(singledata.gradYear), id, result.insertId])

        const email = async () => {
            const info = await sendMail({
                to: `${singledata.email}`,
                subject: "You are registered for Solve For Sakthi",
                html: layout({
                heading: "Registration successful",
                intro: `Hello ${escapeHtml(singledata.name || "Participant")}, you have been registered for Solve For Sakthi ${new Date().getFullYear()} in team <b>${escapeHtml(TeamName)}</b>, led by ${escapeHtml(leademail || "your team lead")}. We wish you all the best!`,
                rows: [["Name", singledata.name], ["Role", singledata.role], ["Email", singledata.email], ["Phone", singledata.phone], ["Gender", singledata.gender], ["Graduation year", singledata.gradYear]],
            })
, 
            });

            console.log("Message sent:", info.messageId);
        }

        // sent in the background so a slow mail server never holds up creating the team
        email().catch((err) => console.error("Team member mail failed:", err.message))
        // console.log(dev)
    }
  
    // signup()
  


    res.status(200).send(result.insertId)
    
})

const Update_team = async(req,res) => {
  const { team, id, mentorEmail, mentorName } = req.body;
  const { teamName, members } = team;
  if (!(await loadTeamFor(req, res, id, { manage: true }))) return;
  const yearError = gradYearError(members);
  if (yearError) return res.status(400).json({ message: yearError });

  const [result] = await connection.query(
    `UPDATE SolveForSakthi_Team_List 
   SET NAME = ?, MENTOR_NAME = ?, MENTOR_EMAIL = ? 
   WHERE ID = ?`,
    [teamName, mentorName, mentorEmail, id]
  );

  for (const member of members) {
    const [result] = await connection.query("UPDATE SolveForSakthi_Team_Members_List SET NAME = ?, EMAIL = ?, PHONE = ?, GENDER = ?, GRAD_YEAR = ? WHERE TEAM_ID = ? AND ROLE = ?", [member.name, member.email, member.phone, member.gender, Number(member.gradYear), id, member.role])
    
  
      
  }

  res.send("Updated")
  
  
}

export {Add_Team_Members, Update_team}