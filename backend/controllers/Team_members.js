import connection from "../database/mysql.js";
import AsyncHandler from "../utils/AsyncHandler.js";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

/* ====================== ADD TEAM MEMBERS ====================== */

const Add_Team_Members = AsyncHandler(async (req, res) => {
  const { Teamdata, mentorEmail, mentorName } = req.body;
  const { id } = req.params;

  const TeamName = Teamdata.teamName;
  const TeamMemberData = Teamdata.members;
  let leademail;

  /* ---------- INSERT TEAM (MSSQL WAY) ---------- */
  const [rows] = await connection.query(
    `
    INSERT INTO Team_List (NAME, SPOC_ID, MENTOR_NAME, MENTOR_EMAIL)
    OUTPUT INSERTED.ID AS insertId
    VALUES (?, ?, ?, ?)
    `,
    [TeamName, id, mentorName, mentorEmail]
  );

  const insertId = rows[0].insertId; // ✅ THIS IS THE TEAM ID
  console.log("Inserted Team ID:", insertId);

  /* ---------- INSERT TEAM MEMBERS ---------- */
  for (let i = 0; i < TeamMemberData.length; i++) {
    const singledata = TeamMemberData[i];

    if (singledata.role === "Team Lead") {
      await connection.query(
        `UPDATE Team_List SET LEAD_EMAIL = ?, LEAD_PHONE = ? WHERE ID = ?`,
        [singledata.email, singledata.phone, insertId]
      );
      leademail = singledata.email;
    }

    await connection.query(
      `
      INSERT INTO Team_Members_List
      (ROLE, NAME, EMAIL, PHONE, GENDER, SPOC_ID, TEAM_ID)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        singledata.role,
        singledata.name,
        singledata.email,
        singledata.phone,
        singledata.gender,
        id,
        insertId
      ]
    );

    /* ---------- MAIL ---------- */
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: process.env.SMTP_PORT,
      secure: true,
      auth: {
        user: "damodara2006@gmail.com",
        pass: process.env.DAMO_GMAIL_PASS
      }
    });

    const sendMail = async () => {
      const info = await transporter.sendMail({
        from: '"Sakthi Auto" <damodara2006@gmail.com>',
        to: singledata.email,
        subject: "You have registered for Sakthi-auto contest",
        html: `
<div style="font-family: Arial, sans-serif; background-color: #f5f6fa; padding: 20px;">
  <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 10px; padding: 30px;">
    <h2 style="text-align: center;">🎉 Registration Successful!</h2>
    <p>
      You have successfully registered for the
      <strong>Sakthi-Auto Contest ${new Date().getFullYear()}</strong>
      under the team head <strong>${leademail}</strong>.
    </p>
    <div style="border: 2px solid; padding: 10px; background: #ddd;">
      <p>Name: ${singledata.name}</p>
      <p>Phone: ${singledata.phone}</p>
      <p>Email: ${singledata.email}</p>
      <p>Gender: ${singledata.gender}</p>
    </div>
    <p style="text-align:center;font-size:13px;">
      © ${new Date().getFullYear()} Sakthi-Auto Contest
    </p>
  </div>
</div>
`
      });

      console.log("Message sent:", info.messageId);
    };

    await sendMail();
  }

  /* ---------- RESPONSE (UNCHANGED) ---------- */
  res.status(200).send(insertId);
});

/* ====================== UPDATE TEAM ====================== */

const Update_team = async (req, res) => {
  const { team, id, mentorEmail, mentorName } = req.body;
  const { teamName, members } = team;

  await connection.query(
    `
    UPDATE Team_List
    SET NAME = ?, MENTOR_NAME = ?, MENTOR_EMAIL = ?
    WHERE ID = ?
    `,
    [teamName, mentorName, mentorEmail, id]
  );

  for (const member of members) {
    await connection.query(
      `
      UPDATE Team_Members_List
      SET NAME = ?, EMAIL = ?, PHONE = ?, GENDER = ?
      WHERE TEAM_ID = ? AND ROLE = ?
      `,
      [
        member.name,
        member.email,
        member.phone,
        member.gender,
        id,
        member.role
      ]
    );
  }

  res.send("Updated");
};

/* ====================== EXPORTS ====================== */

export { Add_Team_Members, Update_team };
