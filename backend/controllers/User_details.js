import AsyncHandler from "../utils/AsyncHandler.js";
import connection from "../database/db.js";
import { sendMail } from "../utils/mailer.js"
import { layout, escapeHtml } from "../utils/notifications.js"
import { compare, hashSync } from "bcrypt"
import cookie from "cookie-parser"
import jwt from "jsonwebtoken"
import { isEmailVerified, consumeVerifiedEmail } from "./Verify_OTP.js"
import crypto from "crypto"
import { notifyAccountCreated } from "../utils/notifications.js"

const signup = AsyncHandler(async (req, res) => {
    const { email, password, role, college, college_code, name, date } = req.body;
    // basic presence check
    if ([email, password, role, college_code, name].some((data) => !data || String(data).trim() === "")) {
        return res.status(400).send("All fields required");
    }
    
    // Who may create which account:
    //   SPOC / EVALUATOR - anyone, once the email passed the OTP check; an admin then approves them
    //   STUDENT (team lead login) - only a logged-in SPOC or ADMIN, from the team screen
    //   anything else (e.g. ADMIN) - never through this endpoint
    const requestedRole = String(role).toUpperCase();
    const creatorRole = String(req.user?.ROLE || "").toUpperCase();
    if (requestedRole === "SPOC" || requestedRole === "EVALUATOR") {
        if (!isEmailVerified(email)) {
            return res.status(403).json({ message: "Verify your email with the OTP first" });
        }
    } else if (requestedRole === "STUDENT") {
        if (!["SPOC", "ADMIN"].includes(creatorRole)) {
            return res.status(403).json({ message: "Student accounts are created by the SPOC" });
        }
    } else {
        return res.status(400).json({ message: "Invalid role" });
    }

    let bcryptpass = hashSync(password, 10);
    try {
        if (requestedRole === "SPOC" || requestedRole === "EVALUATOR") {
            const query = `INSERT INTO SolveForSakthi_Users(EMAIL,PASSWORD, ROLE, COLLEGE, COLLEGE_CODE, NAME, DATE, STATUS) VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING')`;
            const params = [email, bcryptpass, requestedRole, college, college_code, name, date];
            const [result] = await connection.query(query, params);
            consumeVerifiedEmail(email);
            res.status(200).json(result);

        }
        else {
            const query = `INSERT INTO SolveForSakthi_Users(EMAIL,PASSWORD, ROLE, COLLEGE, COLLEGE_CODE, NAME, DATE, STATUS) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
            const params = [email, bcryptpass, role.toUpperCase(), college, college_code, name, date, 'ACTIVE'];
            const [result] = await connection.query(query, params);
            res.status(200).json(result);


          
  
         
                    const info = await sendMail({
                        to: email,
                        subject: "Your Solve For Sakthi team login",
                        html: layout({
                heading: "Your team account is ready",
                intro: `Hello ${escapeHtml(name)}, your SPOC created your team's account for Solve For Sakthi. Log in with the details below to request problem statements and submit solutions.`,
                rows: [["Login email", email], ["Password", password]],
                outro: "Please keep these details private.",
                linkPath: "/login", linkLabel: "Log in",
            })
                    });

                    console.log("Message sent:", info.messageId);
           

              


      

        }
    } catch (error) {
        console.error("Signup failed:", error.message)
        if (!res.headersSent) res.status(201).send("error")
    }

})

// Login cookie settings, chosen per request so it works however the platform is reached:
//  - frontend and backend on the same site (the /api proxy, or same host on another port): SameSite=Lax,
//    Secure only over HTTPS so plain-http addresses (e.g. a VPN IP) keep working
//  - frontend on a different host over HTTPS: SameSite=None + Secure, the only combination browsers
//    accept for a cross-site login cookie
const loginCookieOptions = (req) => {
    let crossSite = false;
    try {
        const origin = req.get("origin");
        crossSite = Boolean(origin) && new globalThis.URL(origin).hostname !== req.hostname;
    } catch {
        crossSite = false;
    }
    const sameSiteNone = crossSite && req.secure;
    return { httpOnly: true, secure: req.secure, sameSite: sameSiteNone ? "none" : "lax", path: "/" };
};

// Simple in-memory login attempt tracker to mitigate brute-force
const loginAttempts = new Map(); // key -> { count, firstAttemptTs } 
const MAX_ATTEMPTS = 20;
const BLOCK_TIME_MS = 15 * 60 * 1000; // 15 minutes

const login = async (req, res) => {
    const { email, password } = req.body;
    // per account and address: many users can share one IP behind a VPN / NAT, so an IP-only key would
    // let one person's failed attempts lock everybody out
    const clientKey = `${String(email || "").trim().toLowerCase()}|${req.ip}`;

    const attempt = loginAttempts.get(clientKey);
    if (attempt && attempt.count >= MAX_ATTEMPTS && (Date.now() - attempt.firstAttemptTs) < BLOCK_TIME_MS) {
        return res.status(429).json({ data: 'LOCKED', message: 'Too many failed login attempts. Try again later.' });
    }

    const [result] = await connection.query("SELECT * FROM SolveForSakthi_Users WHERE EMAIL = (?)", [email])
    if (!result || result.length === 0) {
        // no user found
        return res.status(401).json({ data: "REJECTED", message: "Invalid credentials" });
    }

    const user = result[0];
    const safeUser = result.map(({ PASSWORD, ...rest }) => rest);

    let response;
    try {
        response = await compare(password, user.PASSWORD);
    } catch (err) {
        return res.status(500).json({ data: "REJECTED", message: "Internal error" });
    }

    let rs = user.STATUS
    if (rs === "ACTIVE" && response) {
        // successful login: clear any recorded attempts
        loginAttempts.delete(clientKey);

        const token = jwt.sign(safeUser[0], process.env.JWT_SCERET, { expiresIn: "4h" });
        // The frontend reaches the API on the same site (nginx /api proxy), so Lax works everywhere;
        // Secure follows the real scheme so login also works over plain http on an internal network
        res.cookie("login_creditionals", token, { ...loginCookieOptions(req), maxAge: 4 * 60 * 60 * 1000 })


        res.json({ data: response, user: safeUser })
    }
    else if (rs == 'PENDING') {
        res.json({ data: "PENDING", user: safeUser })
    }
    else {
        // failed auth: increment attempts
        if (!attempt) {
            loginAttempts.set(clientKey, { count: 1, firstAttemptTs: Date.now() });
        } else {
            attempt.count = (attempt.count || 0) + 1;
            loginAttempts.set(clientKey, attempt);
        }
        res.status(401).json({ data: "REJECTED", user: safeUser })
    }

}

const logout = async (req, res) => {
    try {
        // cleared with the same settings it was set with, otherwise browsers may keep it
        res.clearCookie("login_creditionals", loginCookieOptions(req));
        return res.status(200).json({ message: "Logout successful" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Logout failed' });
    }
}

const GetAllUsers = AsyncHandler(async (req, res) => {
    const [users] = await connection.query("SELECT * FROM SolveForSakthi_Users");
    res.status(200).json(users.map(({ PASSWORD, ...rest }) => rest));
});

const GetAllEvaluators = AsyncHandler(async (req, res) => {
    const [users, error] = await connection.query("SELECT * FROM SolveForSakthi_Users WHERE ROLE='EVALUATOR'")
    res.send(users.map(({ PASSWORD, ...rest }) => rest))
})

const verifyEmail = async (req, res) => {
    const { email } = req.body;
    const [data, err] = await connection.query("SELECT ID FROM SolveForSakthi_Users WHERE EMAIL = ?", [email])
    res.send(data.length == 0 ? true : false)
}

const UpdateUser = AsyncHandler(async (req, res) => {
    const { id, name, phone } = req.body;

    if (!id) {
        return res.status(400).json({ message: "User ID is required" });
    }
    // users edit their own profile; only an admin may edit someone else's
    if (req.user.ROLE !== "ADMIN" && String(req.user.ID) !== String(id)) {
        return res.status(403).json({ message: "You can only update your own profile" });
    }

    // Dynamic query construction to update only provided fields
    let fields = [];
    let params = [];

    if (name) {
        fields.push("NAME = ?");
        params.push(name);
    }
    if (phone) {
        fields.push("PHONE = ?");
        params.push(phone);
    }

    if (fields.length === 0) {
        return res.status(400).json({ message: "No fields to update" });
    }

    params.push(id);

    const query = `UPDATE SolveForSakthi_Users SET ${fields.join(", ")} WHERE ID = ?`;

    try {
        const [result] = await connection.query(query, params);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "User not found or no changes made" });
        }
        res.status(200).json({ message: "Profile updated successfully" });
    } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ message: "Failed to update profile" });
    }
});

export { signup, login, logout, GetAllUsers, GetAllEvaluators, verifyEmail, UpdateUser }

// Platform admin creates an ADMIN, SPOC or EVALUATOR account. It is active immediately (no OTP or
// approval) and behaves exactly like a self-registered account of that role, including new admins.
const CREATABLE_ROLES = ["ADMIN", "SPOC", "EVALUATOR"]
const Admin_create_user = AsyncHandler(async (req, res) => {
    const { email, name, college, phone } = req.body;
    const role = String(req.body.role || "").toUpperCase();
    let { password, college_code } = req.body;

    if (!CREATABLE_ROLES.includes(role)) {
        return res.status(400).json({ message: "Role must be ADMIN, SPOC or EVALUATOR" });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim()) || !name || !String(name).trim()) {
        return res.status(400).json({ message: "Name and a valid email are required" });
    }
    if (role === "SPOC" && (!college || !college_code)) {
        return res.status(400).json({ message: "College name and college code are required for a SPOC" });
    }
    if (password && String(password).length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
    }
    // no password given: generate one; it is emailed to the new user
    if (!password) password = crypto.randomBytes(9).toString("base64url");
    // COLLEGE_CODE is UNIQUE and SQL Server allows only one NULL there, so staff accounts get their own code
    if (!college_code) college_code = `${role}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

    const normalizedEmail = String(email).trim().toLowerCase();
    const [existing] = await connection.query("SELECT ID FROM SolveForSakthi_Users WHERE EMAIL = ?", [normalizedEmail]);
    if (existing.length > 0) {
        return res.status(409).json({ message: "A user with this email already exists" });
    }
    const [codeTaken] = await connection.query("SELECT ID FROM SolveForSakthi_Users WHERE COLLEGE_CODE = ?", [college_code]);
    if (codeTaken.length > 0) {
        return res.status(409).json({ message: "This college code is already used by another account" });
    }

    const [result] = await connection.query(
        "INSERT INTO SolveForSakthi_Users (EMAIL, PASSWORD, ROLE, COLLEGE, COLLEGE_CODE, NAME, PHONE, DATE, STATUS) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')",
        [normalizedEmail, hashSync(password, 10), role, college || null, college_code, String(name).trim(), phone || null, new Date().toString().split(" ").slice(1, 4).join(" ")]
    );
    notifyAccountCreated({ email: normalizedEmail, name: String(name).trim(), role, password });
    res.status(201).json({ message: `${role} account created`, id: result.insertId });
});

export { Admin_create_user }
