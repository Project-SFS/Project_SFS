import nodemailer from "nodemailer"
import dotenv from "dotenv"

dotenv.config()

const port = Number(process.env.SMTP_PORT) || 587

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "mail.abtlimited.com",
    port,
    // 465 = implicit TLS; 587 = plain connection upgraded with STARTTLS
    secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : port === 465,
    auth: {
        user: process.env.SMTP_USER || "donotreply@sakthiauto.in",
        pass: process.env.MAIL_PASS,
    },
    tls: {
        rejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== "false",
    },
})

const fromAddress = process.env.MAIL_FROM || process.env.SMTP_USER || "donotreply@sakthiauto.in"

// The sender address must be the authenticated mailbox, so callers only choose the display name
const sendMail = ({ fromName = "Solve For Sakthi", ...message }) =>
    transporter.sendMail({ from: `"${fromName}" <${fromAddress}>`, ...message })

export { transporter, sendMail }
