import crypto from "crypto";
import fs from "fs";
import path from "path";
import connection from "../database/db.js";
import AsyncHandler from "../utils/AsyncHandler.js";
import { sendMail, waitForPendingMail } from "../utils/mailer.js";
import { layout, escapeHtml } from "../utils/notifications.js";

// Portal reset (main admin, or an admin with all three permissions): empties every Solve For Sakthi table and deletes every uploaded file.
// Every admin account is kept (the main admin and the other admins, with their permissions); SPOCs, team
// logins and all other data are deleted. Guarded by a one-time code emailed to the admin who asks for it and by typing RESET.

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

// GET /admin/reset/summary: what a reset would delete, and the admin accounts it keeps
const Reset_summary = AsyncHandler(async (req, res) => {
    const tables = await platformTables();
    const counts = [];
    for (const name of tables) {
        const [[row]] = await connection.query(
            name === USERS_TABLE
                ? `SELECT COUNT(*) AS n FROM [${name}] WHERE ROLE IS NULL OR ROLE <> 'ADMIN'`
                : `SELECT COUNT(*) AS n FROM [${name}]`);
        counts.push({
            table: name === USERS_TABLE ? "SPOC and team accounts" : name.replace(/^SolveForSakthi_/, "").replace(/_/g, " "),
            rows: Number(row?.n) || 0,
        });
    }
    const [admins] = await connection.query("SELECT EMAIL, NAME, IS_SUPER_ADMIN FROM SolveForSakthi_Users WHERE ROLE = 'ADMIN' ORDER BY IS_SUPER_ADMIN DESC, ID");
    res.json({
        mainAdmin: (await mainAdmin())?.EMAIL || null,
        keep: admins.map((a) => ({ email: a.EMAIL, name: a.NAME, main: Boolean(a.IS_SUPER_ADMIN) })),
        tables: counts,
        files: uploadedFiles().length,
    });
});

// the main admin account (told about every reset)
const mainAdmin = async () => {
    const [rows] = await connection.query("SELECT TOP 1 ID, EMAIL, NAME FROM SolveForSakthi_Users WHERE ROLE = 'ADMIN' AND IS_SUPER_ADMIN = 1");
    return rows[0];
};

// POST /admin/reset/send-otp: emails a 6-digit code to the admin who asks for the reset
const Reset_send_otp = AsyncHandler(async (req, res) => {
    if (!req.user.EMAIL) return res.status(400).json({ message: "Your account has no email address" });
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
                intro: `You asked to <b>reset the Solve For Sakthi portal</b>. This deletes every challenge, team, SPOC, submission, file and email record; only the admin accounts are kept.<br>Your code:<br><span style="display:inline-block;margin-top:12px;font-size:28px;font-weight:bold;letter-spacing:6px;color:#c53030;">${code}</span>`,
                outro: "The code is valid for 10 minutes. If you did not ask for this, do not share the code and change your password.",
            }),
        });
    } catch (err) {
        pendingCodes.delete(req.user.ID);
        console.error("Reset code mail failed:", err.message);
        return res.status(502).json({ message: "Could not send the code email, please try again" });
    }
    res.json({ message: `A code was sent to your email (${req.user.EMAIL})`, expiresInMinutes: OTP_TTL_MS / 60000 });
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
                // admin accounts stay (main admin + the others); SPOC and team logins go
                const [r] = await connection.query(`DELETE FROM [${name}] WHERE ROLE IS NULL OR ROLE <> 'ADMIN'`);
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
        console.log(`Portal reset by admin ${req.user.ID} (${req.user.EMAIL}):`, JSON.stringify(deleted));
    } finally {
        resetRunning = false;
    }

    // a record of the reset (the first entries of the new mail log): to the admin who ran it and, separately,
    // to the main admin if that was someone else (no cc)
    const main = await mainAdmin();
    for (const to of [...new Set([main?.EMAIL, req.user.EMAIL].filter(Boolean))]) sendMail({
        to,
        subject: "The Solve For Sakthi portal was reset",
        html: layout({
            heading: "Portal reset completed",
            intro: `${escapeHtml(req.user.EMAIL)} reset the portal on ${escapeHtml(new Date().toLocaleString("en-IN", { timeZone: process.env.APP_TIMEZONE || "Asia/Kolkata" }))}. Every challenge, team, SPOC, submission, file and email record was deleted. The admin accounts were kept.`,
            linkPath: "/admin", linkLabel: "Open the admin panel",
        }),
    }).catch((err) => console.error("Reset confirmation mail failed:", err.message));

    res.json({ message: "The portal was reset. All admin accounts were kept; everything else was deleted.", deleted });
});

export { Reset_summary, Reset_send_otp, Reset_confirm };
