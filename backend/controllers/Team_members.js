import {connectDB} from "../database/ms-sql.js";
import AsyncHandler from "../utils/AsyncHandler.js";
import nodemailer from "nodemailer"
import dotenv from "dotenv"
import { signup } from "./User_details.js";
dotenv.config()

const Add_Team_Members = AsyncHandler(async (req, res) => {
  const { Teamdata, mentorEmail, mentorName } = req.body;
  const { id } = req.params;
  console.log(id);
  console.log(Teamdata, mentorEmail, mentorName);
  // return;
  
  
    // console.log(data.members)
    const TeamName = Teamdata.teamName;
    const TeamMemberData = Teamdata.members;
    let leademail;
  const [result] = await connection.query(`insert into Team_List(NAME, SPOC_ID, MENTOR_NAME, MENTOR_EMAIL) VALUES (?,?,?,?)`,[TeamName, id,mentorName, mentorEmail])
    console.log(result.insertId)
    for (let i = 0; i < TeamMemberData.length; i++){
        let singledata = TeamMemberData[i];
        // console.log(singledata)
        if (singledata.role == "Team Lead") {
            await connection.query(`UPDATE Team_List SET LEAD_EMAIL = ? WHERE ID = ?`,[singledata.email, result.insertId])
            await connection.query(`UPDATE Team_List SET LEAD_PHONE = ? WHERE ID = ?`,[singledata.phone, result.insertId])
            leademail = singledata.email
        }
        const [res] = await connection.query(`insert into Team_Members_List(ROLE, NAME, EMAIL, PHONE, GENDER, SPOC_ID, TEAM_ID) values (?,?,?,?,?,?,?)`,[singledata.role, singledata.name, singledata.email, singledata.phone, singledata.gender, id, result.insertId])

        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true, 
            auth: {
                user: "damodara2006@gmail.com",
                pass: process.env.DAMO_GMAIL_PASS,
            },
        });
        const email = async () => {
            const info = await transporter.sendMail({
                from: '"Sakthi Auto" <damodara2006@gmail.com>',
                to: `${singledata.email}`,
                subject: "You have registered for Sakthi-auto contest",
                // text: "You have registered for Sakthi-auto contest",
                html: `
  <div style="font-family: Arial, sans-serif; background-color: #f5f6fa; padding: 20px;">
    <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); padding: 30px;">
      <h2 style="color: #2f3640; text-align: center;">🎉 Registration Successful!</h2>
      <p style="font-size: 16px; color: #333333;">
        Hello <strong>Participant</strong>,
      </p>
      <p style="font-size: 16px; color: #333333; line-height: 1.5;">
        You have successfully registered for the <strong>Sakthi-Auto Contest ${new Date().getFullYear()}</strong> 
        under the team head <strong style="color: #0984e3;">${leademail}</strong>.
      </p>
      <p style="font-size: 16px; color: #333333; line-height: 1.5;">
        We’re excited to have you on board and wish you all the best for the contest!
      </p>
      <p style="font-size: 16px; color: #333333; line-height: 1.5;">
        Your Details : 
      </p>
          <br/>
     <div style=" border: 2px solid; width:fit-content; padding-right: 10px; padding-left: 10px; background-color: rgb(179, 176, 176); border-radius: 5px; color:black;">

        <p style="font-family:monospace; font-weight: bolder;">Name- <span style="font-weight: lighter;">${singledata.name}</span></p>
         <p style="font-family:monospace; font-weight: bolder">Phone-<span style="font-weight: lighter;">${singledata.phone}</span></p>
         <p style="font-family:monospace; font-weight: bolder">Registered mail-<span style="font-weight: lighter;">${singledata.email}</span></p>
         <p style="font-family:monospace; font-weight: bolder">Gender-<span style="font-weight: lighter;">${singledata.gender}</span></p>
    </div>
      <div style="text-align: center; margin-top: 30px;">
        <a href="#" style="background-color: #00a8ff; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-size: 16px;">View Details</a>
      </div>
      <p style="font-size: 13px; color: #888888; text-align: center; margin-top: 30px;">
        © ${new Date().getFullYear()} Sakthi-Auto Contest. All rights reserved.
      </p>
    </div>
  </div>
`
, 
            });

            console.log("Message sent:", info.messageId);
        }

        await email()
        // console.log(dev)
    }
  
    // signup()
  


    res.status(200).send(result.insertId)
    
})

const Update_team = async(req,res) => {
  const { team, id, mentorEmail, mentorName } = req.body;
  const { teamName, members } = team;

  const [result] = await connection.query(
    `UPDATE Team_List 
   SET NAME = ?, MENTOR_NAME = ?, MENTOR_EMAIL = ? 
   WHERE ID = ?`,
    [teamName, mentorName, mentorEmail, id]
  );

  for (const member of members) {
    const [result] = await connection.query("UPDATE Team_Members_List SET NAME = ?, EMAIL = ?, PHONE = ?, GENDER = ? WHERE TEAM_ID = ? AND ROLE = ?", [member.name, member.email, member.phone, member.gender, id, member.role])
    console.log(result);
    
  
      
  }

  res.send("Updated")
  
  
}

export {Add_Team_Members, Update_team}