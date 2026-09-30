import nodemailer from "nodemailer"
import dotenv from "dotenv"

dotenv.config()

const port = Number(process.env.SMTP_PORT) || 587
const smtpHost = process.env.SMTP_HOST || "mail.abtlimited.com"
const user = process.env.SMTP_USER || "donotreply@sakthiauto.in"
// Nodemailer resolves the host with its own DNS query (dns.resolve4), which ignores /etc/hosts and
// Docker extra_hosts. On the server that query returns an internal relay that answers "250 OK" but
// never delivers. SMTP_CONNECT_IP (set in docker-compose.yml) pins the real server; TLS still checks
// the certificate for smtpHost.
const connectIp = process.env.SMTP_CONNECT_IP?.trim()

// One log line per mail: which server it really connected to, its greeting, the address the mail
// server sees us as, and its final reply, e.g.
//   SMTP 118.91.233.65:587 | 220 mail.abtlimited.com | seen as 10.10.5.254 | 250 OK
// (the real server greets "220 mail.abtlimited.com"; anything else is a relay on the way).
// Only these fields are kept from nodemailer's protocol log - never the login or the message.
const smtpTrace = new Map()
const smtpLogger = {
    level: () => {},
    trace: () => {}, warn: () => {}, fatal: () => {}, info: (meta, message) => {
        if (meta?.tnx !== "network") return
        if (meta.remoteAddress) smtpTrace.set(meta.sid, { to: `${meta.remoteAddress}:${meta.remotePort}` })
        // printed when the connection closes (a send ends with "Connection closed", not QUIT)
        const trace = smtpTrace.get(meta.sid)
        if (trace && /closed/i.test(String(message))) {
            if (trace.last) console.log(`SMTP ${trace.to} | ${trace.greeting || "?"} | seen as ${trace.seenAs || "?"} | ${trace.last}`)
            smtpTrace.delete(meta.sid)
        }
    },
    error: (meta, message) => console.error("SMTP error:", String(message)),
    debug: (meta, message) => {
        const trace = meta?.sid && smtpTrace.get(meta.sid)
        if (!trace) return
        const text = String(message)
        if (meta.tnx === "server") {
            if (!trace.greeting && text.startsWith("220")) trace.greeting = text.split("\n")[0].trim()
            const seenAs = /Hello \[([^\]]+)\]/.exec(text)?.[1]
            if (seenAs) trace.seenAs = seenAs
            if (/^250 /.test(text)) trace.last = text.trim()
        }
    },
}

// Settings: SMTP_HOST, SMTP_PORT, SMTP_USER, MAIL_PASS (+ SMTP_CONNECT_IP from docker-compose.yml).
// Port 587 = STARTTLS (secure: false); port 465 = TLS from the start.
const transporter = nodemailer.createTransport({
    host: connectIp || smtpHost,
    servername: smtpHost,
    port,
    secure: port === 465,
    auth: {
        user,
        pass: process.env.MAIL_PASS,
    },
    tls: {
        servername: smtpHost,
    },
    logger: smtpLogger,
    debug: true,
})

// mails are sent from the authenticated mailbox itself
const fromAddress = user

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
