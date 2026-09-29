import fs from "fs";
import connection from "../database/db.js";
import AsyncHandler from "../utils/AsyncHandler.js";
import { today, checkProblemOpen } from "../utils/deadline.js";
import { notifySubmission } from "../utils/notifications.js";
import { isAssignedToTeamOf } from "./TeamProblems.js";
import multer from "multer"
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads')
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, file.fieldname + '-' + uniqueSuffix+".pdf")
    }
})

const maxUploadMb = Number(process.env.UPLOAD_MAX_MB) || 20

// Submissions are stored and displayed as PDFs, so reject anything else up front
const upload = multer({
    storage: storage,
    limits: { fileSize: maxUploadMb * 1024 * 1024, files: 1 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === "application/pdf") return cb(null, true)
        cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", "Only PDF files are allowed"))
    }
})

const removeUploaded = (files = []) => files.forEach((f) => fs.unlink(f.path, () => {}))

const uploadFiles = AsyncHandler(async(req, res) => {
    const files = req.files || [];
    const { link, description, title } = req.body
    const problemId = parseInt(req.body.problemId, 10)
    // a student can only submit for their own team; the email in the form is not trusted
    const email = req.user.ROLE === "STUDENT" ? req.user.EMAIL : req.body.email

    if (files.length === 0) {
        return res.status(400).json({ message: "A PDF file is required" });
    }
    if (Number.isNaN(problemId) || !email || !title) {
        removeUploaded(files);
        return res.status(400).json({ message: "problemId, email and title are required" });
    }

    const closedReason = await checkProblemOpen(problemId);
    if (closedReason) {
        removeUploaded(files);
        return res.status(400).json({ message: closedReason });
    }

    if (req.user.ROLE === "STUDENT" && !(await isAssignedToTeamOf(email, problemId))) {
        removeUploaded(files);
        return res.status(400).json({ message: "This problem statement is not assigned to your team. Request it from your SPOC first." });
    }

    // One submission per team per problem: resubmitting before evaluation replaces it,
    // after evaluation it is locked
    const [existing] = await connection.query("SELECT TOP 1 ID, STATUS, FILES FROM SolveForSakthi_Submissions WHERE TEAM_EMAIL = ? AND PROBLEM_ID = ? ORDER BY ID DESC", [email, problemId]);
    const previous = existing[0];
    if (previous && previous.STATUS !== "PENDING") {
        removeUploaded(files);
        return res.status(400).json({ message: "This solution has already been evaluated and can no longer be changed" });
    }

    let submissionId = previous?.ID;
    try {
        if (previous) {
            await connection.query("UPDATE SolveForSakthi_Submissions SET SOL_TITLE = ?, SOL_DESCRIPTION = ?, SUB_DATE = ?, SOL_LINK = ?, FILES = ? WHERE ID = ?", [title, description || null, today(), link || null, files[0].path, previous.ID]);
        } else {
            const [inserted] = await connection.query("INSERT INTO SolveForSakthi_Submissions (PROBLEM_ID, TEAM_EMAIL, SOL_TITLE,SOL_DESCRIPTION,SUB_DATE, SOL_LINK, FILES, STATUS) VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING')", [problemId, email, title, description || null, today(), link || null, files[0].path]);
            submissionId = inserted.insertId;
        }
    } catch (error) {
        removeUploaded(files);
        throw error;
    }

    if (previous?.FILES) removeUploaded([{ path: previous.FILES }]);
    notifySubmission(submissionId, Boolean(previous));
    res.json({ replaced: Boolean(previous) });
})

export { upload, uploadFiles }
