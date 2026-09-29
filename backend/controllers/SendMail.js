import connection from "../database/db.js";
import AsyncHandler from "../utils/AsyncHandler.js";
import { sendMail } from "../utils/mailer.js"
import { layout, escapeHtml } from "../utils/notifications.js"
import dotenv from "dotenv"
dotenv.config();

const sendMailToSpoc = AsyncHandler(async (req, res) => {
  const { Problem } = req.body;
  
    const [data, err] = await connection.query("select EMAIL, NAME from SolveForSakthi_Users WHERE ROLE='SPOC' AND STATUS='ACTIVE'");
    // console.log(data);
    let batchSize = 5;
    const email = async (data, problem) => {
        const info = await sendMail({
            to: data.EMAIL,
            subject: `New problem statement: ${problem}`,
            html: layout({
                heading: "A new problem statement is available",
                intro: `Hello ${escapeHtml(data.NAME || "")}, a new problem statement has been published for Solve For Sakthi ${new Date().getFullYear()}. Your teams can request it from their team portal, or you can assign it to them under Team Progress.`,
                rows: [["Problem", problem]],
                linkPath: "/spoc", linkLabel: "Open SPOC portal",
            })
        });

        console.log("Message sent:", info.messageId);
    };

    for (let i = 0; i < data.length; i = i + batchSize) {
        const batch = data.slice(i, i + batchSize);

        await Promise.all(
            batch.map(user => email(user, Problem).catch(err => console.error("SPOC mail failed:", user.EMAIL, err.message)))
        )
    }

    res.status(200).json({ message: "Mails processed", count: data.length });

})

export { sendMailToSpoc }