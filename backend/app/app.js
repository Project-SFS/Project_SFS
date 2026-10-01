import express from "express"
import cors from "cors"
import multer from "multer"
import router from "../router/router.js"
import cookieParser from "cookie-parser"
import path from "path";
import fs from "fs";
import connection, { ping } from "../database/db.js";
import { requireAuth } from "../middleware/auth.js";
import { canViewTeamOfLead } from "../utils/teamAccess.js";
import AsyncHandler from "../utils/AsyncHandler.js";
import { requestContext } from "../utils/requestContext.js";

const app = express()
app.disable("x-powered-by")
// behind nginx (and possibly a TLS load balancer): trust the proxy so req.secure / req.ip are real
app.set('trust proxy', Number(process.env.TRUST_PROXY_HOPS) || 1)
app.use(requestContext)

// CORS: the frontend normally calls /api on its own address (no CORS involved). For direct calls to
// this backend, allowed automatically: any page on the same server (same IP / host name, e.g.
// <server-ip>:9021 -> <server-ip>:9022). CORS_ORIGINS adds other addresses; * allows any.
const corsOrigins = (process.env.CORS_ORIGINS || "").split(",").map(o => o.trim().replace(/\/+$/, "")).filter(Boolean)
const sameServer = (origin, req) => {
    try {
        return new globalThis.URL(origin).hostname === req.hostname
    } catch {
        return false
    }
}
app.use(cors((req, callback) => {
    const origin = req.get("origin")
    const allowed = !origin || corsOrigins.includes("*") || corsOrigins.includes(origin) || sameServer(origin, req)
    callback(null, { origin: allowed ? origin || false : false, credentials: true })
}))

app.use(cookieParser())

// Solution PDFs are private to the team, its SPOC and admins
const uploadsDir = path.join(process.cwd(), "uploads")
app.get("/uploads/:file", requireAuth, AsyncHandler(async (req, res) => {
    const file = path.basename(req.params.file)
    const [rows] = await connection.query("SELECT TOP 1 TEAM_EMAIL FROM SolveForSakthi_Submissions WHERE FILES = ?", [`uploads/${file}`])
    if (!rows[0] || !(await canViewTeamOfLead(req, rows[0].TEAM_EMAIL)) || !fs.existsSync(path.join(uploadsDir, file))) {
        return res.status(404).json({ message: "File not found" })
    }
    res.sendFile(path.join(uploadsDir, file))
}))
app.use(express.json({ limit: "1mb" }))

// used by the Docker healthcheck: the API is only healthy when the database answers
app.get("/health", async (req, res) => {
    try {
        await ping()
        res.json({ status: "ok" })
    } catch (error) {
        res.status(503).json({ status: "error", message: "database unavailable" })
    }
})

app.use(router)

// errors thrown outside AsyncHandler (e.g. upload limits) still get a JSON response
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        const message = err.code === "LIMIT_FILE_SIZE" ? "File is too large" : (err.field || err.message)
        return res.status(400).json({ message })
    }
    console.error(`${req.method} ${req.originalUrl} failed:`, err.message)
    res.status(err.status || 500).json({ error: process.env.NODE_ENV === "production" ? "Internal Server Error" : err.message })
})

export default app
