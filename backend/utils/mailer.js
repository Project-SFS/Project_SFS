import nodemailer from "nodemailer"
import dotenv from "dotenv"

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

// Main account: SMTP_HOST, SMTP_PORT, SMTP_USER, MAIL_PASS (+ SMTP_CONNECT_IP for mail.abtlimited.com)
const mainAccount = createAccount({
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
    .replace(/<\/(p|div|h[1-6]|tr|table)>/gi, "\n")
    .replace(/<\/td>\s*<td[^>]*>/gi, ": ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .split("\n").map((line) => line.replace(/\s+/g, " ").trim()).filter(Boolean).join("\n")

// Optional second account: OTP_SMTP_HOST, OTP_SMTP_PORT, OTP_SMTP_USER, OTP_MAIL_PASS.
// OTP mails always use it; other mails use it when the main account fails.
// Without it everything goes through the main account.
const otpAccount = createAccount({
    host: env("OTP_SMTP_HOST") || "smtp.gmail.com",
    port: env("OTP_SMTP_PORT"),
    user: env("OTP_SMTP_USER"),
    pass: env("OTP_MAIL_PASS"),
})

if (!mainAccount && !otpAccount) console.error("No mail account set: fill SMTP_USER and MAIL_PASS in backend/.env")

// Log in to each account once at startup, so a wrong password or blocked port shows up in the logs
// right away instead of on the first mail (the app keeps running either way)
if (process.env.NODE_ENV !== "test") {
    for (const [name, account] of [["main", mainAccount], ["OTP", otpAccount]]) {
        account?.transporter.verify()
            .then(() => console.log(`Mail account ready (${name}): ${account.label}`))
            .catch((err) => console.error(`Mail account NOT working (${name}): ${account.label} - ${err.message}`))
    }
}

// The sender address must be the authenticated mailbox, so callers only choose the display name
const send = (account, { fromName = "Solve For Sakthi", ...message }) =>
    account.transporter.sendMail({
        from: `"${fromName}" <${account.user}>`,
        ...(message.html && !message.text ? { text: htmlToText(message.html) } : {}),
        ...message,
    })

const sendMail = async (message) => {
    if (!mainAccount) return send(otpAccount, message)
    try {
        return await send(mainAccount, message)
    } catch (err) {
        if (!otpAccount) throw err
        console.error(`Main mail account failed (${err.message}), sending to ${message.to} through ${otpAccount.user}`)
        return send(otpAccount, message)
    }
}

const sendOtpMail = (message) => (otpAccount ? send(otpAccount, message) : sendMail(message))

const transporter = (mainAccount || otpAccount)?.transporter

export { transporter, sendMail, sendOtpMail }
