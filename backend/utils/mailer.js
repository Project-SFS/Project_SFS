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

// Plain-text version of an HTML mail. HTML-only mails are a strong spam signal (Gmail filters them,
// especially verification-code mails), so every mail is sent with both parts.
const htmlToText = (html) => String(html)
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, "$2 ($1)")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|tr|table)>/gi, "\n")
    .replace(/<\/td>\s*<td[^>]*>/gi, ": ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .split("\n").map((line) => line.replace(/\s+/g, " ").trim()).filter(Boolean).join("\n")

// The sender address must be the authenticated mailbox, so callers only choose the display name
const sendMail = ({ fromName = "Solve For Sakthi", ...message }) =>
    transporter.sendMail({
        from: `"${fromName}" <${fromAddress}>`,
        ...(message.html && !message.text ? { text: htmlToText(message.html) } : {}),
        ...message,
    })

export { transporter, sendMail }
