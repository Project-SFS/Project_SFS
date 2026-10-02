import fs from "fs";
import connection from "../database/db.js";
import AsyncHandler from "../utils/AsyncHandler.js";
import { today, checkProblemOpen } from "../utils/deadline.js";
import { notifySubmission } from "../utils/notifications.js";
import { isAssignedToTeamOf } from "./TeamProblems.js";
import multer from "multer"
import { canTeamEdit, lockedMessage, uploadClosedReason } from "../utils/review.js";
import { MAX_FILES, MAX_FILE_MB, KINDS, kindFromName, contentMatches, filePathsOf, unlinkAll } from "../utils/submissionFiles.js";
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads')
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, `files-${uniqueSuffix}${KINDS[kindFromName(file.originalname)]?.ext || ".bin"}`)
    }
})

// 1-3 files, each a PDF or PowerPoint (.pptx) up to MAX_FILE_MB
const upload = multer({
    storage: storage,
    limits: { fileSize: MAX_FILE_MB * 1024 * 1024, files: MAX_FILES },
    fileFilter: (req, file, cb) => {
        if (kindFromName(file.originalname)) return cb(null, true)
        cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", "Only PDF and PowerPoint (.pptx) files are allowed"))
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
        return res.status(400).json({ message: "Attach at least one file (PDF or PowerPoint)" });
    }
    if (files.length > MAX_FILES) {
        removeUploaded(files);
        return res.status(400).json({ message: `You can attach at most ${MAX_FILES} files` });
    }
    // the content has to match the extension (a renamed file is refused)
    const bad = files.find((f) => !contentMatches(f.path, kindFromName(f.originalname)));
    if (bad) {
        removeUploaded(files);
        return res.status(400).json({ message: `"${bad.originalname}" is not a valid ${kindFromName(bad.originalname) === "PPTX" ? "PowerPoint (.pptx)" : "PDF"} file` });
    }
    if (Number.isNaN(problemId) || !email || !title) {
        removeUploaded(files);
        return res.status(400).json({ message: "problemId, email and title are required" });
    }

    // One submission per team per problem: while it is awaiting review or changes were requested, a new
    // upload replaces it (and goes back for review); once approved or rejected it is locked
    const [existing] = await connection.query("SELECT TOP 1 ID, STATUS, FILES FROM SolveForSakthi_Submissions WHERE TEAM_EMAIL = ? AND PROBLEM_ID = ? ORDER BY ID DESC", [email, problemId]);
    const previous = existing[0];

    const closedReason = uploadClosedReason(await checkProblemOpen(problemId), previous);
    if (closedReason) {
        removeUploaded(files);
        return res.status(400).json({ message: closedReason });
    }

    if (req.user.ROLE === "STUDENT" && !(await isAssignedToTeamOf(email, problemId))) {
        removeUploaded(files);
        return res.status(400).json({ message: "This problem statement is not assigned to your team. Request it from your SPOC first." });
    }

    if (previous && !canTeamEdit(previous.STATUS)) {
        removeUploaded(files);
        return res.status(400).json({ message: lockedMessage(previous.STATUS) });
    }

    let submissionId = previous?.ID;
    try {
        if (previous) {
            await connection.query("UPDATE SolveForSakthi_Submissions SET SOL_TITLE = ?, SOL_DESCRIPTION = ?, SUB_DATE = ?, SOL_LINK = ?, FILES = ?, STATUS = 'PENDING' WHERE ID = ?", [title, description || null, today(), link || null, files[0].path, previous.ID]);
        } else {
            const [inserted] = await connection.query("INSERT INTO SolveForSakthi_Submissions (PROBLEM_ID, TEAM_EMAIL, SOL_TITLE,SOL_DESCRIPTION,SUB_DATE, SOL_LINK, FILES, STATUS) VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING')", [problemId, email, title, description || null, today(), link || null, files[0].path]);
            submissionId = inserted.insertId;
        }
    } catch (error) {
        removeUploaded(files);
        throw error;
    }

    // the new set of files replaces the previous one
    const oldPaths = previous ? await filePathsOf([previous.ID]) : [];
    if (previous) await connection.query("DELETE FROM SolveForSakthi_Submission_Files WHERE SUBMISSION_ID = ?", [previous.ID]);
    for (const [i, f] of files.entries()) {
        await connection.query(
            "INSERT INTO SolveForSakthi_Submission_Files (SUBMISSION_ID, FILE_PATH, ORIGINAL_NAME, KIND, SIZE_BYTES, SORT_ORDER) VALUES (?, ?, ?, ?, ?, ?)",
            [submissionId, f.path, String(f.originalname).slice(0, 255), kindFromName(f.originalname), f.size, i]
        );
    }
    unlinkAll([...new Set([...oldPaths, previous?.FILES])].filter((p) => p && !files.some((f) => f.path === p)));
    notifySubmission(submissionId, Boolean(previous));
    res.json({ replaced: Boolean(previous) });
})

export { upload, uploadFiles }
