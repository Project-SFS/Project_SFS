import crypto from "crypto"
import { sendMail } from "../utils/mailer.js"
import { layout } from "../utils/notifications.js"

// email -> { hash, expiresAt, attempts, sentAt } for codes that were sent
const pendingOtps = new Map()
// email -> expiresAt for addresses that proved ownership and may register
const verifiedEmails = new Map()

const OTP_TTL_MS = 10 * 60 * 1000
const VERIFIED_TTL_MS = 30 * 60 * 1000
const RESEND_INTERVAL_MS = 30 * 1000
const MAX_ATTEMPTS = 5

const normalize = (email) => String(email || "").trim().toLowerCase()
const hash = (otp) => crypto.createHash("sha256").update(String(otp)).digest("hex")

// The OTP only ever leaves the server by email; the browser proves it by calling /verify_otp
const Verify_OTP = async (req, res) => {
    const email = normalize(req.params.email)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ message: "Enter a valid email" })
    }

    const previous = pendingOtps.get(email)
    if (previous && Date.now() - previous.sentAt < RESEND_INTERVAL_MS) {
        return res.status(429).json({ message: "Please wait a few seconds before requesting another OTP" })
    }

    const otp = crypto.randomInt(100000, 1000000)
    pendingOtps.set(email, { hash: hash(otp), expiresAt: Date.now() + OTP_TTL_MS, attempts: 0, sentAt: Date.now() })

    try {
        const info = await sendMail({
            to: email,
            // the code in the subject makes every OTP mail unique (no Gmail threading) and readable at a glance
            subject: `${otp} is your Solve For Sakthi verification code`,
            html: layout({
                heading: "Verify your email",
                intro: `Use this code to verify your email address for Solve For Sakthi:<br><span style="display:inline-block;margin-top:12px;font-size:28px;font-weight:bold;letter-spacing:6px;color:#fc9300;">${otp}</span>`,
                outro: "The code is valid for 10 minutes. If you did not request it, you can ignore this email.",
            }),
        });
        console.log(`Mail sent (otp) to ${email}:`, info.response, info.messageId);
    } catch (err) {
        pendingOtps.delete(email)
        console.error("OTP mail failed:", err.message)
        return res.status(502).json({ message: "Could not send the OTP email, please try again" })
    }

    res.status(200).json({ message: "OTP sent" })
}

const Verify_OTP_Check = (req, res) => {
    const email = normalize(req.body.email)
    const entry = pendingOtps.get(email)

    if (!entry || entry.expiresAt < Date.now()) {
        pendingOtps.delete(email)
        return res.status(400).json({ message: "OTP expired, please request a new one" })
    }
    if (entry.attempts >= MAX_ATTEMPTS) {
        pendingOtps.delete(email)
        return res.status(400).json({ message: "Too many wrong attempts, please request a new OTP" })
    }
    if (hash(String(req.body.otp || "").trim()) !== entry.hash) {
        entry.attempts++
        return res.status(400).json({ message: "Invalid OTP. Please try again." })
    }

    pendingOtps.delete(email)
    verifiedEmails.set(email, Date.now() + VERIFIED_TTL_MS)
    res.status(200).json({ verified: true })
}

const isEmailVerified = (email) => {
    const expiresAt = verifiedEmails.get(normalize(email))
    return Boolean(expiresAt && expiresAt > Date.now())
}

const consumeVerifiedEmail = (email) => verifiedEmails.delete(normalize(email))

// drop expired entries so the maps do not grow forever
setInterval(() => {
    const now = Date.now()
    for (const [email, entry] of pendingOtps) if (entry.expiresAt < now) pendingOtps.delete(email)
    for (const [email, expiresAt] of verifiedEmails) if (expiresAt < now) verifiedEmails.delete(email)
}, 60 * 1000).unref()

export { Verify_OTP, Verify_OTP_Check, isEmailVerified, consumeVerifiedEmail }
