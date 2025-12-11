import connection from "../database/ms-sql.js";
import AsyncHandler from "../utils/AsyncHandler.js";
import nodemailer from "nodemailer"
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: "damodara2006@gmail.com",
        pass: process.env.DAMO_GMAIL_PASS,
    },
});

const sendMailToSpoc = AsyncHandler(async (req, res) => {
    const { Problem } = req.body;
    const [data, err] = await connection.query("select EMAIL, NAME from Users WHERE ROLE='SPOC' AND STATUS='ACTIVE'");
    // console.log(data);
    let batchSize = 5;
    const email = async (data, problem) => {
        const info = await transporter.sendMail({
            from: '"Sakthi Auto Register" <damodara2006@gmail.com>',
            to: data.EMAIL,
            subject: "🚀 New Problem Added to Solve for Sakthi!",
            html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>New Problem Added</title>
</head>

<body style="font-family: Arial, sans-serif; background-color: #f5f6fa; margin:0; padding:0;">

  <div style="max-width:600px;margin:20px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);">

    <!-- Header -->
    <div style="background:#2e86de;color:#fff;padding:20px;text-align:center;">
      <h2 style="margin:0;font-size:24px;">🚀 New Problem Released!</h2>
    </div>

    <!-- Body -->
    <div style="padding:30px;">
      <p style="font-size:16px;color:#333;line-height:1.6;">
        Hello ${data.NAME},
      </p>

      <p style="font-size:16px;color:#333;line-height:1.6;">
        A new problem has been added to the <strong>Sakthi-Auto Contest ${new Date().getFullYear()}</strong>.
      </p>

      <p style="font-size:16px;color:#333;line-height:1.6;">
        🧠 <strong>Problem Title:</strong>
      </p>

      <div style="background:#f1f2f6;border-left:4px solid #2e86de;padding:15px;border-radius:4px;margin-bottom:20px;">
        <p style="font-size:16px;color:#2f3640; margin:0;">
          ${problem}
        </p>
      </div>

      <p style="font-size:16px;color:#333;line-height:1.6;">
        Visit the portal to explore this problem in detail and start solving!
      </p>

      
    </div>

    <!-- Footer -->
    <div style="background:#f1f2f6;padding:15px;text-align:center;font-size:13px;color:#555;">
      © ${new Date().getFullYear()} Sakthi-Auto Contest. All rights reserved.
    </div>

  </div>

</body>
</html>
`
        });

        console.log("Message sent:", info.messageId);
    };

    for (let i = 0; i < data.length; i = i + batchSize) {
        const batch = data.slice(i, i + batchSize);

        await Promise.all(
            batch.map(user => email(user, Problem))
        )
    }


})

export { sendMailToSpoc }