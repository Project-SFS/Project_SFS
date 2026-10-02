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
import { sendStoredFile, readShareToken, MAX_FILE_MB, MAX_FILES } from "../utils/submissionFiles.js";

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

// Solution files are private to the team, its SPOC and admins
const uploadsDir = path.join(process.cwd(), "uploads")
app.get("/uploads/:file", requireAuth, AsyncHandler(async (req, res) => {
    const file = path.basename(req.params.file)
    const [rows] = await connection.query(`
        SELECT TOP 1 f.FILE_PATH, f.ORIGINAL_NAME, f.KIND, s.TEAM_EMAIL
        FROM SolveForSakthi_Submission_Files f JOIN SolveForSakthi_Submissions s ON s.ID = f.SUBMISSION_ID
        WHERE f.FILE_PATH = ?`, [`uploads/${file}`])
    if (!rows[0] || !(await canViewTeamOfLead(req, rows[0].TEAM_EMAIL)) || !fs.existsSync(path.join(uploadsDir, file))) {
        return res.status(404).json({ message: "File not found" })
    }
    sendStoredFile(res, rows[0])
}))

// Shared link to one solution file (signed, expires after SHARE_LINK_DAYS): no login needed, so it can be
// sent to someone or opened by an online PowerPoint viewer
app.get("/shared/file/:token", AsyncHandler(async (req, res) => {
    const fileId = readShareToken(req.params.token)
    if (!fileId) return res.status(410).json({ message: "This link is invalid or has expired. Ask for a new link." })
    const [rows] = await connection.query("SELECT FILE_PATH, ORIGINAL_NAME, KIND FROM SolveForSakthi_Submission_Files WHERE ID = ?", [fileId])
    if (!rows[0]) return res.status(404).json({ message: "This file is no longer available" })
    res.setHeader("Cache-Control", "private, max-age=300")
    sendStoredFile(res, rows[0])
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
        const message = err.code === "LIMIT_FILE_SIZE" ? `Each file can be at most ${MAX_FILE_MB} MB`
            : err.code === "LIMIT_FILE_COUNT" ? `You can attach at most ${MAX_FILES} files`
            : (err.field || err.message)
        return res.status(400).json({ message })
    }
    console.error(`${req.method} ${req.originalUrl} failed:`, err.message)
    res.status(err.status || 500).json({ error: process.env.NODE_ENV === "production" ? "Internal Server Error" : err.message })
})

export default app
