import AsyncHandler from "../utils/AsyncHandler.js";
import connection from "../database/mysql.js";
import nodemailer from "nodemailer";
import { compare, hashSync } from "bcrypt";
import jwt from "jsonwebtoken";

/* ====================== SIGNUP ====================== */

const signup = AsyncHandler(async (req, res) => {
    const { email, password, role, college, college_code, name, date } = req.body;

    if ([email, password, role, college_code, name].some(v => !v || String(v).trim() === "")) {
        return res.status(400).send("All fields required");
    }

    const bcryptpass = hashSync(password, 10);

    try {
        if (role === "spoc") {
            const query =
                `INSERT INTO Users (EMAIL, PASSWORD, ROLE, COLLEGE, COLLEGE_CODE, NAME, DATE)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`;

            const params = [email, bcryptpass, role.toUpperCase(), college, college_code, name, date];
            const [result] = await connection.query(query, params);
            return res.status(200).json(result);
        }

        if (role === "STUDENT") {
            const query =
                `INSERT INTO Users (EMAIL, PASSWORD, ROLE, COLLEGE, COLLEGE_CODE, NAME, DATE, STATUS)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

            const params = [email, bcryptpass, role.toUpperCase(), college, college_code, name, date, "ACTIVE"];
            const [result] = await connection.query(query, params);

            res.status(200).json(result); // DO NOT CHANGE RESPONSE

            const transporter = nodemailer.createTransport({
                host: "smtp.gmail.com",
                port: process.env.SMTP_PORT,
                secure: true,
                auth: {
                    user: "damodara2006@gmail.com",
                    pass: process.env.DAMO_GMAIL_PASS
                }
            });

            await transporter.sendMail({
                from: '"Sakthi Auto Register" <damodara2006@gmail.com>',
                to: email,
                subject: "🚀Your Team Created for Solve For Sakthi!",
                html: `
                    <h3>Your Team Created</h3>
                    <p><b>Email:</b> ${email}</p>
                    <p><b>Password:</b> ${password}</p>
                `
            });

            return;
        }

        const query =
            `INSERT INTO Users (EMAIL, PASSWORD, ROLE, COLLEGE, COLLEGE_CODE, NAME, DATE, STATUS)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

        const params = [email, bcryptpass, role.toUpperCase(), college, college_code, name, date, "ACTIVE"];
        const [result] = await connection.query(query, params);
        return res.status(200).json(result);

    } catch (error) {
        console.error(error);
        return res.status(201).send("error");
    }
});

/* ====================== LOGIN ====================== */

const loginAttempts = new Map();
const MAX_ATTEMPTS = 20;
const BLOCK_TIME_MS = 15 * 60 * 1000;

const login = async (req, res) => {
    const { email, password } = req.body;
    const clientKey = req.ip || email;

    const attempt = loginAttempts.get(clientKey);
    if (attempt && attempt.count >= MAX_ATTEMPTS && (Date.now() - attempt.firstAttemptTs) < BLOCK_TIME_MS) {
        return res.status(429).json({ data: "LOCKED", message: "Too many attempts" });
    }

    const [result] = await connection.query(
        "SELECT * FROM Users WHERE EMAIL = ?",
        [email]
    );

    if (!result || result.length === 0) {
        return res.status(401).json({ data: "REJECTED", message: "Invalid credentials" });
    }

    const user = result[0];
    const response = await compare(password, user.PASSWORD);

    if (user.STATUS === "ACTIVE" && response) {
        loginAttempts.delete(clientKey);

        const token = jwt.sign(user, process.env.JWT_SCERET);
        res.cookie("login_creditionals", token, {
            maxAge: 14400000,
            secure: true,
            sameSite: "none",
            path: "/"
        });

        return res.json({ data: response, user: result });
    }

    if (user.STATUS === "PENDING") {
        return res.json({ data: "PENDING", user: result });
    }

    if (!attempt) {
        loginAttempts.set(clientKey, { count: 1, firstAttemptTs: Date.now() });
    } else {
        attempt.count++;
        loginAttempts.set(clientKey, attempt);
    }

    return res.status(401).json({ data: "REJECTED", user: result });
};

/* ====================== LOGOUT ====================== */

const logout = async (req, res) => {
    try {
        res.clearCookie("login_creditionals", {
            maxAge: 864000,
            secure: true,
            httpOnly: true,
            sameSite: "lax"
        });
        return res.status(200).json({ message: "Logout successful" });
    } catch (error) {
        return res.status(500).json({ message: "Logout failed" });
    }
};

/* ====================== GET USERS ====================== */

const GetAllUsers = AsyncHandler(async (req, res) => {
    const [users] = await connection.query("SELECT * FROM Users");
    res.status(200).json(users);
});

const GetAllEvaluators = AsyncHandler(async (req, res) => {
    const [users] = await connection.query(
        "SELECT * FROM Users WHERE ROLE = 'EVALUATOR'"
    );
    res.send(users);
});

/* ====================== VERIFY EMAIL ====================== */

const verifyEmail = async (req, res) => {
    const { email } = req.body;
    const [data] = await connection.query(
        "SELECT * FROM Users WHERE EMAIL = ?",
        [email]
    );
    res.send(data.length == 0 ? true : false);
};

/* ====================== UPDATE USER ====================== */

const UpdateUser = AsyncHandler(async (req, res) => {
    const { id, name, phone } = req.body;

    if (!id) {
        return res.status(400).json({ message: "User ID is required" });
    }

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

    const query = `UPDATE Users SET ${fields.join(", ")} WHERE ID = ?`;

    try {
        await connection.query(query, params);
        res.status(200).json({ message: "Profile updated successfully" });
    } catch (error) {
        res.status(500).json({ message: "Failed to update profile" });
    }
});

/* ====================== EXPORTS ====================== */

export {
    signup,
    login,
    logout,
    GetAllUsers,
    GetAllEvaluators,
    verifyEmail,
    UpdateUser
};
