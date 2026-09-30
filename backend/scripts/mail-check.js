// Mail diagnostics. Run on the server:
//   docker compose exec backend node scripts/mail-check.js you@example.com
// Shows where SMTP_HOST points, what the mail server says, and sends one test mail.
import dns from "dns/promises"
import net from "net"
import { transporter } from "../utils/mailer.js"

const host = process.env.SMTP_HOST || "mail.abtlimited.com"
const port = Number(process.env.SMTP_PORT) || 587
const to = process.argv[2]

const greeting = () => new Promise((resolve) => {
    const socket = net.connect(port, host)
    let buf = ""
    socket.setTimeout(10000, () => { socket.destroy(); resolve("TIMEOUT - cannot reach the mail server on port " + port) })
    socket.on("data", (d) => { buf += d; if (buf.includes("\n")) { socket.end("QUIT\r\n"); resolve(buf.split("\n")[0].trim()) } })
    socket.on("error", (e) => resolve("ERROR - " + e.message))
})

console.log(`SMTP_HOST ${host}:${port}`)
console.log("resolves to :", (await dns.lookup(host).catch((e) => ({ address: "ERROR " + e.message }))).address, "(expected 118.91.233.65)")
console.log("greeting    :", await greeting(), "(expected: 220 mail.abtlimited.com)")

if (!to) {
    console.log("\nAdd an email address to also send a test mail: node scripts/mail-check.js you@example.com")
    process.exit(0)
}
try {
    const info = await transporter.sendMail({
        from: process.env.MAIL_FROM, to,
        subject: "Solve For Sakthi - server mail check " + new Date().toISOString().slice(11, 19),
        text: "Test mail sent from the backend container on the server.",
    })
    console.log("send reply  :", info.response, "| accepted:", info.accepted.join(", ") || "-", "| rejected:", info.rejected.join(", ") || "-")
    console.log("message id  :", info.messageId)
} catch (e) {
    console.log("send FAILED :", e.code || "", e.response || e.message)
}
process.exit(0)
