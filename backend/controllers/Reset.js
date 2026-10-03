import crypto from "crypto";
import fs from "fs";
import path from "path";
import connection from "../database/db.js";
import AsyncHandler from "../utils/AsyncHandler.js";
import { sendMail, waitForPendingMail } from "../utils/mailer.js";
import { layout, escapeHtml } from "../utils/notifications.js";

// Portal reset (main admin only): empties every Solve For Sakthi table and deletes every uploaded file.
// The only thing kept is the main admin's own account. Guarded by a one-time code emailed to the main admin
// and by typing RESET.

const OTP_TTL_MS = 10 * 60 * 1000;
const RESEND_INTERVAL_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;
const CONFIRM_WORD = "RESET";
const USERS_TABLE = "SolveForSakthi_Users";
const uploadsDir = path.join(process.cwd(), "uploads");

// userId -> { hash, expiresAt, attempts, sentAt }
const pendingCodes = new Map();
const hash = (code) => crypto.createHash("sha256").update(String(code)).digest("hex");
let resetRunning = false;

// every table that belongs to the platform (found in the database, so new tables are always included)
const platformTables = async () => {
    const [rows] = await connection.query("SELECT name FROM sys.tables WHERE name LIKE 'SolveForSakthi[_]%' ORDER BY name");
    return rows.map((r) => r.name).filter((name) => /^SolveForSakthi_[A-Za-z0-9_]+$/.test(name));
};

const uploadedFiles = () => {
    try {
        return fs.readdirSync(uploadsDir).filter((f) => fs.statSync(path.join(uploadsDir, f)).isFile());
    } catch {
        return [];
    }
};

// GET /admin/reset/summary: what a reset would delete
const Reset_summary = AsyncHandler(async (req, res) => {
    const tables = await platformTables();
    const counts = [];
    for (const name of tables) {
        const [[row]] = await connection.query(
            name === USERS_TABLE
                ? `SELECT COUNT(*) AS n FROM [${name}] WHERE ID <> ?`
                : `SELECT COUNT(*) AS n FROM [${name}]`,
            name === USERS_TABLE ? [req.user.ID] : []);
        counts.push({ table: name.replace(/^SolveForSakthi_/, "").replace(/_/g, " "), rows: Number(row?.n) || 0 });
    }
    res.json({ keep: { email: req.user.EMAIL, name: req.user.NAME }, tables: counts, files: uploadedFiles().length });
});

// POST /admin/reset/send-otp: emails a 6-digit code to the main admin
const Reset_send_otp = AsyncHandler(async (req, res) => {
    const previous = pendingCodes.get(req.user.ID);
    if (previous && Date.now() - previous.sentAt < RESEND_INTERVAL_MS) {
        return res.status(429).json({ message: "A code was sent less than a minute ago. Please wait before asking for another." });
    }
    const code = crypto.randomInt(100000, 1000000);
    pendingCodes.set(req.user.ID, { hash: hash(code), expiresAt: Date.now() + OTP_TTL_MS, attempts: 0, sentAt: Date.now() });
    try {
        await sendMail({
            sensitive: true,
            to: req.user.EMAIL,
            subject: `${code} is your Solve For Sakthi portal reset code`,
            html: layout({
                heading: "Confirm the portal reset",
                intro: `Someone signed in as the main admin asked to <b>reset the Solve For Sakthi portal</b>. This deletes every problem statement, team, SPOC, admin, submission, file and email record; only your main admin account is kept.<br>Your code:<br><span style="display:inline-block;margin-top:12px;font-size:28px;font-weight:bold;letter-spacing:6px;color:#c53030;">${code}</span>`,
                outro: "The code is valid for 10 minutes. If you did not ask for this, do not share the code and change your password.",
            }),
        });
    } catch (err) {
        pendingCodes.delete(req.user.ID);
        console.error("Reset code mail failed:", err.message);
        return res.status(502).json({ message: "Could not send the code email, please try again" });
    }
    res.json({ message: `A code was sent to ${req.user.EMAIL}`, expiresInMinutes: OTP_TTL_MS / 60000 });
});

// POST /admin/reset/confirm { otp, confirm: "RESET" }: checks the code, then empties the portal
const Reset_confirm = AsyncHandler(async (req, res) => {
    const entry = pendingCodes.get(req.user.ID);
    if (String(req.body?.confirm || "").trim() !== CONFIRM_WORD) {
        return res.status(400).json({ message: `Type ${CONFIRM_WORD} to confirm` });
    }
    if (!entry || entry.expiresAt < Date.now()) {
        pendingCodes.delete(req.user.ID);
        return res.status(400).json({ message: "The code has expired or was not requested. Send a new code." });
    }
    if (entry.attempts >= MAX_ATTEMPTS) {
        pendingCodes.delete(req.user.ID);
        return res.status(429).json({ message: "Too many wrong codes. Send a new code." });
    }
    if (hash(String(req.body?.otp || "").trim()) !== entry.hash) {
        entry.attempts += 1;
        return res.status(400).json({ message: `Wrong code. ${MAX_ATTEMPTS - entry.attempts} attempt(s) left.` });
    }
    pendingCodes.delete(req.user.ID);
    if (resetRunning) return res.status(409).json({ message: "A reset is already running" });

    resetRunning = true;
    const deleted = {};
    try {
        // let mails that are still being sent finish first, so nothing is logged into the emptied tables later
        await waitForPendingMail(15000);
        for (const name of await platformTables()) {
            if (name === USERS_TABLE) {
                const [r] = await connection.query(`DELETE FROM [${name}] WHERE ID <> ?`, [req.user.ID]);
                deleted[name] = r.affectedRows;
            } else {
                const [r] = await connection.query(`DELETE FROM [${name}]`);
                deleted[name] = r.affectedRows;
                // IDs start again from 1 (only tables with an identity column)
                await connection.query(`IF OBJECTPROPERTY(OBJECT_ID(N'dbo.${name}'), 'TableHasIdentity') = 1 DBCC CHECKIDENT ('dbo.${name}', RESEED, 0) WITH NO_INFOMSGS`);
            }
        }
        const files = uploadedFiles();
        files.forEach((f) => fs.unlink(path.join(uploadsDir, f), () => {}));
        deleted.files = files.length;
        console.log(`Portal reset by main admin ${req.user.ID} (${req.user.EMAIL}):`, JSON.stringify(deleted));
    } finally {
        resetRunning = false;
    }

    // a record of the reset for the main admin (the first entry of the new mail log)
    sendMail({
        to: req.user.EMAIL,
        subject: "The Solve For Sakthi portal was reset",
        html: layout({
            heading: "Portal reset completed",
            intro: `The portal was reset on ${escapeHtml(new Date().toLocaleString("en-IN", { timeZone: process.env.APP_TIMEZONE || "Asia/Kolkata" }))}. Every table was emptied and every uploaded file deleted. Your main admin account is the only one left.`,
            linkPath: "/admin", linkLabel: "Open the admin panel",
        }),
    }).catch((err) => console.error("Reset confirmation mail failed:", err.message));

    res.json({ message: "The portal was reset. Only your main admin account is left.", deleted });
});

export { Reset_summary, Reset_send_otp, Reset_confirm };
