import nodemailer from "nodemailer"
import dotenv from "dotenv"
import connection from "../database/db.js"

dotenv.config()

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

// .env values without surrounding spaces or quotes
const env = (name) => (process.env[name] || "").trim().replace(/^(['"])(.*)\1$/, "$2")

// One SMTP account. Port 465 = TLS from the start, anything else (587) = STARTTLS.
// Gmail / Google Workspace app passwords are shown as "abcd efgh ijkl mnop"; the spaces are dropped.
// connectIp: connect to this IP instead of looking the host up in DNS; TLS still checks the certificate
// for the host name. Only used for mail.abtlimited.com, whose name points at an internal relay on the
// server's network (nodemailer's own DNS query ignores /etc/hosts and Docker extra_hosts).
const createAccount = ({ host, port, user, pass, connectIp }) => {
    if (!host || !user || !pass) return null
    port = Number(port) || (host === "smtp.gmail.com" ? 465 : 587)
    if (host === "smtp.gmail.com") pass = pass.replace(/\s+/g, "")
    if (connectIp && host !== "mail.abtlimited.com") {
        console.warn(`SMTP_CONNECT_IP ignored: it is only for mail.abtlimited.com, not ${host}`)
        connectIp = ""
    }
    return {
        user,
        label: `${user} via ${host}:${port}`,
        transporter: nodemailer.createTransport({
            host: connectIp || host,
            port,
            secure: port === 465,
            auth: { user, pass },
            tls: { servername: host },
            logger: smtpLogger,
            debug: true,
            // fail with a clear error instead of hanging silently when the network drops the connection
            connectionTimeout: 20000,
            greetingTimeout: 20000,
            socketTimeout: 60000,
        }),
    }
}

// The one mail account, from backend/.env: SMTP_HOST, SMTP_PORT, SMTP_USER, MAIL_PASS
// (+ SMTP_CONNECT_IP for mail.abtlimited.com). Every mail, OTPs included, is sent through it.
const account = createAccount({
    host: env("SMTP_HOST") || "mail.abtlimited.com",
    port: env("SMTP_PORT"),
    user: env("SMTP_USER") || "donotreply@sakthiauto.in",
    pass: env("MAIL_PASS"),
    connectIp: env("SMTP_CONNECT_IP"),
})

// Plain-text version of an HTML mail. HTML-only mails are a strong spam signal (Gmail filters them,
// especially verification-code mails), so every mail is sent with both parts.
const htmlToText = (html) => String(html)
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, "$2 ($1)")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<li[^>]*>/gi, "\n- ")
    .replace(/<\/(p|div|h[1-6]|tr|table|li|ol|ul)>/gi, "\n")
    .replace(/<\/td>\s*<td[^>]*>/gi, ": ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .split("\n").map((line) => line.replace(/\s+/g, " ").trim()).filter(Boolean).join("\n")

if (!account) console.error("No mail account set: fill SMTP_HOST, SMTP_USER and MAIL_PASS in backend/.env")

// Log in once at startup, so a wrong password or blocked port shows up in the logs right away
// instead of on the first mail (the app keeps running either way)
if (account && process.env.NODE_ENV !== "test") {
    account.transporter.verify()
        .then(() => console.log(`Mail account ready: ${account.label}`))
        .catch((err) => console.error(`Mail account NOT working: ${account.label} - ${err.message}`))
}

// Every mail is written to SolveForSakthi_Mail_Log for the admin's communication history.
// sensitive: true (passwords, verification codes) keeps the recipients and subject but not the text.
// Logging never blocks or breaks sending.
const addresses = (value) => (Array.isArray(value) ? value.join(", ") : value ? String(value) : null)
const logMail = (message, text, status, error) => {
    trackMailWork(connection.query(
        "INSERT INTO SolveForSakthi_Mail_Log (TO_ADDR, CC_ADDR, SUBJECT, BODY_TEXT, STATUS, ERROR, SENT_AT) VALUES (?, ?, ?, ?, ?, ?, SYSUTCDATETIME())",
        [
            addresses(message.to)?.slice(0, 1000) ?? null,
            addresses(message.cc)?.slice(0, 1000) ?? null,
            message.subject ? String(message.subject).slice(0, 500) : null,
            message.sensitive ? "(not stored: this email contained login details or a verification code)" : text || null,
            status,
            error ? String(error).slice(0, 500) : null,
        ]
    ).catch((err) => console.error("Mail log failed:", err.message)))
}

// Mail work still running (notifications prepare their data, then send). On shutdown the server waits
// for it, so a restart or deploy does not drop mails half way.
const pendingWork = new Set()
const trackMailWork = (promise) => {
    pendingWork.add(promise)
    promise.finally(() => pendingWork.delete(promise)).catch(() => {})
    return promise
}
// waits until nothing is pending (work can start more work, e.g. a sent mail is then logged) or the timeout
const waitForPendingMail = async (timeoutMs = 20000) => {
    const deadline = Date.now() + timeoutMs
    while (pendingWork.size > 0 && Date.now() < deadline) {
        await Promise.race([Promise.allSettled([...pendingWork]), new Promise((resolve) => setTimeout(resolve, deadline - Date.now()))])
    }
}

// The sender address must be the authenticated mailbox, so callers only choose the display name
const sendMail = async ({ fromName = "Solve For Sakthi", sensitive = false, cc, bcc, ...message }) => {
    if (!account) throw new Error("No mail account set in backend/.env")
    // the platform never copies people into a mail: every recipient gets their own email
    if (cc || bcc) console.warn(`Mail "${message.subject}": cc/bcc is not used and was dropped`)
    const text = message.text || (message.html ? htmlToText(message.html) : "")
    try {
        const info = await account.transporter.sendMail({
            from: `"${fromName}" <${account.user}>`,
            ...(message.html && !message.text ? { text } : {}),
            ...message,
        })
        logMail({ ...message, sensitive }, text, "SENT")
        return info
    } catch (err) {
        logMail({ ...message, sensitive }, text, "FAILED", err.message)
        throw err
    }
}

const transporter = account?.transporter

const trackedSendMail = (message) => trackMailWork(sendMail(message))

export { transporter, trackedSendMail as sendMail, trackMailWork, waitForPendingMail }
