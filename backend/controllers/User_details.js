import AsyncHandler from "../utils/AsyncHandler.js";
import {connectDB} from "../database/ms-sql.js";
import nodemailer from "nodemailer"
import { compare, hashSync } from "bcrypt"
import cookie from "cookie-parser"
import jwt from "jsonwebtoken"
import sql from "mssql"
const signup = AsyncHandler(async (req, res) => {
    console.log(req.body);
    const { email, password, role, college, college_code, name, date } = req.body;

    if ([email, password, role, college_code, name].some((data) => !data || String(data).trim() === "")) {
        return res.status(400).send("All fields required");
    }

    let bcryptpass = hashSync(password, 10);

    try {
        if (role === "spoc") {
            const result = await sql.query`
                INSERT INTO Users (EMAIL, PASSWORD, ROLE, COLLEGE, COLLEGE_CODE, NAME, DATE)
                VALUES (${email}, ${bcryptpass}, ${role.toUpperCase()}, ${college}, ${college_code}, ${name}, ${date})
            `;
            return res.status(200).json(result.recordset);
        }

        else if (role === "STUDENT") {
            const result = await sql.query`
                INSERT INTO Users (EMAIL, PASSWORD, ROLE, COLLEGE, COLLEGE_CODE, NAME, DATE, STATUS)
                VALUES (${email}, ${bcryptpass}, ${role.toUpperCase()}, ${college}, ${college_code}, ${name}, ${date}, 'ACTIVE')
            `;
            res.status(200).json(result.recordset);

            // send email
            const transporter = nodemailer.createTransport({
                host: "smtp.gmail.com",
                port: 465,
                secure: true,
                auth: {
                    user: "damodara2006@gmail.com",
                    pass: process.env.DAMO_GMAIL_PASS,
                },
            });

            const info = await transporter.sendMail({
                from: '"Sakthi Auto Register" <damodara2006@gmail.com>',
                to: email,
                subject: "🚀Your Team Created for Solve For Sakthi!",
                html: `<h3>Email: ${email}</h3><h3>Password: ${password}</h3>`
            });

            console.log("Message sent:", info.messageId);
        }

        else {
            const result = await sql.query`
                INSERT INTO Users (EMAIL, PASSWORD, ROLE, COLLEGE, COLLEGE_CODE, NAME, DATE, STATUS)
                VALUES (${email}, ${bcryptpass}, ${role.toUpperCase()}, ${college}, ${college_code}, ${name}, ${date}, 'ACTIVE')
            `;
            return res.status(200).json(result.recordset);
        }

    } catch (error) {
        console.log(error);
        return res.status(500).send("error");
    }
});


// Simple in-memory login attempt tracker to mitigate brute-force
const loginAttempts = new Map(); // key -> { count, firstAttemptTs } 
const MAX_ATTEMPTS = 20;
const BLOCK_TIME_MS = 15 * 60 * 1000; // 15 minutes

const login = async (req, res) => {
    const { email, password } = req.body;
    const clientKey = req.ip || email || req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    const attempt = loginAttempts.get(clientKey);
    if (attempt && attempt.count >= MAX_ATTEMPTS && (Date.now() - attempt.firstAttemptTs) < BLOCK_TIME_MS) {
        return res.status(429).json({ data: 'LOCKED', message: 'Too many failed login attempts. Try again later.' });
    }

    const [result] = await connection.query("SELECT * FROM Users WHERE EMAIL = (?)", [email])
    if (!result || result.length === 0) {
        // no user found
        return res.status(401).json({ data: "REJECTED", message: "Invalid credentials" });
    }

    const user = result[0];

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

        const token = jwt.sign(result[0], process.env.JWT_SCERET);
        const isProd = process.env.NODE_ENV === 'production';
        res.cookie("login_creditionals", token, {
            maxAge: 86400000,
            secure: true,
            // httpOnly:
            sameSite: "none",
            path: "/"
        })
        console.log("done");


        res.json({ data: response, user: result })
    }
    else if (rs == 'PENDING') {
        res.json({ data: "PENDING", user: result })
    }
    else {
        // failed auth: increment attempts
        if (!attempt) {
            loginAttempts.set(clientKey, { count: 1, firstAttemptTs: Date.now() });
        } else {
            attempt.count = (attempt.count || 0) + 1;
            loginAttempts.set(clientKey, attempt);
        }
        res.status(401).json({ data: "REJECTED", user: result })
    }

}

const logout = async (req, res) => {
    try {
        const isProd = process.env.NODE_ENV === 'production';
        res.clearCookie("login_creditionals", {
            maxAge: 864000,
            secure: isProd,
            httpOnly: true,
            sameSite: 'lax'
        });
        return res.status(200).json({ message: "Logout successful" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Logout failed' });
    }
}

const GetAllUsers = AsyncHandler(async (req, res) => {
    const [users] = await connection.query("SELECT * FROM Users");
    res.status(200).json(users);
});

const GetAllEvaluators = AsyncHandler(async (req, res) => {
    const [users, error] = await connection.query("SELECT * FROM Users WHERE ROLE='EVALUATOR'")
    res.send(users)
})

const verifyEmail = async (req, res) => {
    const { email } = req.body;
    const data = await sql.query`SELECT * FROM Users WHERE EMAIL='damodara2006@gmail.com'`;
    console.log(data.recordset);

    res.send(data.recordset.length == 0 ? true : false)
}

const UpdateUser = AsyncHandler(async (req, res) => {
    const { id, name, phone } = req.body;

    if (!id) {
        return res.status(400).json({ message: "User ID is required" });
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

    const query = `UPDATE Users SET ${fields.join(", ")} WHERE ID = ?`;

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