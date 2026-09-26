import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import { hashSync } from "bcrypt"
import connection from "./mysql.js"

const schemaPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "../schema/mysql_schema.sql")

// Creates any missing tables, then makes sure an ADMIN user exists.
// Safe to run on every start: tables use IF NOT EXISTS and the admin is only inserted once.
const migrate = async () => {
    const statements = fs.readFileSync(schemaPath, "utf8")
        .replace(/--.*$/gm, "")
        .split(";")
        .map(s => s.trim())
        // the pool is already connected to DB_NAME, so skip database-level statements
        .filter(s => s && !/^(CREATE DATABASE|USE)\b/i.test(s))

    for (const statement of statements) {
        await connection.query(statement)
    }

    const email = process.env.ADMIN_EMAIL || "admin@sakthi.com"
    const password = process.env.ADMIN_PASSWORD || "Admin@123"

    const [admins] = await connection.query("SELECT ID FROM Users WHERE ROLE = 'ADMIN' LIMIT 1")
    if (admins.length === 0) {
        await connection.query(
            "INSERT INTO Users (EMAIL, PASSWORD, ROLE, NAME, STATUS, DATE) VALUES (?, ?, 'ADMIN', 'Admin', 'ACTIVE', ?)",
            [email, hashSync(password, 10), new Date().toISOString().split("T")[0]]
        )
        console.log(`Default admin created: ${email}`)
    }

    console.log("Database migration complete")
}

export default migrate
