import fs from "fs"
import path from "path"
import sql from "mssql"
import { fileURLToPath } from "url"
import { hashSync } from "bcrypt"
import connection, { config } from "./db.js"

const schemaPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "../schema/mssql_schema.sql")

// SQL Server containers start with no application database, so create it from master when missing
const ensureDatabase = async () => {
    const name = config.database
    if (!/^[A-Za-z0-9_]+$/.test(name)) throw new Error(`Invalid DB_NAME: ${name}`)

    const master = await new sql.ConnectionPool({ ...config, database: "master" }).connect()
    try {
        await master.request().query(`IF DB_ID(N'${name}') IS NULL CREATE DATABASE [${name}]`)
    } finally {
        await master.close()
    }
}

// Creates the database and any missing tables/columns, then makes sure an ADMIN user exists.
// Safe to run on every start.
const migrate = async () => {
    if (process.env.DB_CREATE_DATABASE !== "false") {
        // a production login usually has no rights on master and the database already exists
        await ensureDatabase().catch((err) => console.warn(`Skipping database creation: ${err.message}`))
    }

    const statements = fs.readFileSync(schemaPath, "utf8")
        .split(/^\s*GO\s*$/im)
        .map((s) => s.replace(/--.*$/gm, "").trim())
        .filter(Boolean)

    for (const statement of statements) {
        await connection.query(statement)
    }

    const email = process.env.ADMIN_EMAIL || "admin@sakthiauto.com"
    const password = process.env.ADMIN_PASSWORD

    const [admins] = await connection.query("SELECT TOP 1 ID FROM SolveForSakthi_Users WHERE ROLE = 'ADMIN'")
    if (admins.length === 0) {
        if (!password) throw new Error("ADMIN_PASSWORD must be set to create the first admin user")
        // COLLEGE_CODE is UNIQUE and SQL Server allows only one NULL there, so give the admin its own code
        await connection.query(
            "INSERT INTO SolveForSakthi_Users (EMAIL, PASSWORD, ROLE, NAME, STATUS, COLLEGE_CODE, DATE, IS_SUPER_ADMIN, ADMIN_PERMISSIONS) VALUES (?, ?, 'ADMIN', 'Admin', 'ACTIVE', 'ADMIN', ?, 1, 'PROBLEMS,EVALUATE,USERS')",
            [email, hashSync(password, 10), new Date().toISOString().split("T")[0]]
        )
        console.log(`Default admin created: ${email}`)
    }

    // exactly one main admin: the ADMIN_EMAIL account, or else the oldest admin
    const [supers] = await connection.query("SELECT TOP 1 ID FROM SolveForSakthi_Users WHERE ROLE = 'ADMIN' AND IS_SUPER_ADMIN = 1")
    if (supers.length === 0) {
        const [byEmail] = await connection.query("SELECT TOP 1 ID FROM SolveForSakthi_Users WHERE ROLE = 'ADMIN' AND EMAIL = ?", [email])
        const [oldest] = byEmail.length ? [byEmail] : await connection.query("SELECT TOP 1 ID FROM SolveForSakthi_Users WHERE ROLE = 'ADMIN' ORDER BY ID")
        if (oldest[0]) {
            await connection.query("UPDATE SolveForSakthi_Users SET IS_SUPER_ADMIN = 1, ADMIN_PERMISSIONS = 'PROBLEMS,EVALUATE,USERS' WHERE ID = ?", [oldest[0].ID])
            console.log(`Main admin set: user ${oldest[0].ID}`)
        }
    }

    console.log("Database migration complete")
}

export default migrate
