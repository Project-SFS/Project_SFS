import fs from "fs";
import path from "path";
import jwt from "jsonwebtoken";
import connection from "../database/db.js";

// Solution files: up to MAX_FILES per submission, PDF or PowerPoint (.pptx), each up to MAX_FILE_MB.
export const MAX_FILES = 3;
export const MAX_FILE_MB = Number(process.env.UPLOAD_MAX_MB) || 20;
// shared file links work for this many days (SHARE_LINK_DAYS in backend/.env)
export const SHARE_DAYS = Math.max(1, Number(process.env.SHARE_LINK_DAYS) || 7);

export const KINDS = {
    PDF: { ext: ".pdf", mime: "application/pdf" },
    PPTX: { ext: ".pptx", mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation" },
};

// Kind from the file name (the browser's mime type for .pptx varies, so the extension decides)
export const kindFromName = (name) => {
    const ext = path.extname(String(name || "")).toLowerCase();
    return Object.keys(KINDS).find((k) => KINDS[k].ext === ext) || null;
};

// Checks the first bytes so a renamed file cannot pass as a PDF / PPTX:
// PDF starts with "%PDF", a .pptx is a ZIP package ("PK\x03\x04")
export const contentMatches = (filePath, kind) => {
    try {
        const fd = fs.openSync(filePath, "r");
        const head = Buffer.alloc(4);
        fs.readSync(fd, head, 0, 4, 0);
        fs.closeSync(fd);
        if (kind === "PDF") return head.toString("latin1") === "%PDF";
        if (kind === "PPTX") return head[0] === 0x50 && head[1] === 0x4b && head[2] === 0x03 && head[3] === 0x04;
    } catch { /* unreadable -> not accepted */ }
    return false;
};

export const unlinkAll = (paths = []) => paths.filter(Boolean).forEach((p) => fs.unlink(p, () => {}));

// Files of the given submissions: Map submissionId -> [{ ID, NAME, KIND, SIZE_BYTES, PATH }]
export const loadFiles = async (submissionIds) => {
    const ids = [...new Set((submissionIds || []).filter((id) => id != null).map(Number))];
    const byId = new Map(ids.map((id) => [id, []]));
    if (!ids.length) return byId;
    const [rows] = await connection.query(
        `SELECT ID, SUBMISSION_ID, FILE_PATH, ORIGINAL_NAME, KIND, SIZE_BYTES
         FROM SolveForSakthi_Submission_Files WHERE SUBMISSION_ID IN (${ids.map(() => "?").join(", ")})
         ORDER BY SUBMISSION_ID, SORT_ORDER, ID`, ids);
    for (const r of rows) {
        byId.get(Number(r.SUBMISSION_ID))?.push({
            ID: r.ID, NAME: r.ORIGINAL_NAME || path.basename(r.FILE_PATH), KIND: r.KIND, SIZE_BYTES: r.SIZE_BYTES, PATH: r.FILE_PATH,
        });
    }
    return byId;
};

// Adds `files` to each submission row (idKey: the column holding the submission id)
export const withFiles = async (rows, idKey = "ID") => {
    const map = await loadFiles(rows.map((r) => r[idKey]));
    return rows.map((r) => ({ ...r, files: map.get(Number(r[idKey])) || [] }));
};

// Paths stored for a submission (to delete them from disk)
export const filePathsOf = async (submissionIds) => {
    const map = await loadFiles(submissionIds);
    return [...map.values()].flat().map((f) => f.PATH);
};

// Signed, expiring link token for one file: anyone with the link can open that file until it expires
export const shareToken = (fileId) => jwt.sign({ f: Number(fileId), p: "file-share" }, process.env.JWT_SCERET, { expiresIn: `${SHARE_DAYS}d` });
export const readShareToken = (token) => {
    try {
        const data = jwt.verify(String(token || ""), process.env.JWT_SCERET);
        return data?.p === "file-share" && Number.isInteger(data.f) ? data.f : null;
    } catch {
        return null;
    }
};

// Sends a stored file: PDFs open in the browser, PowerPoint files download; the original name is kept
export const sendStoredFile = (res, file) => {
    const uploadsDir = path.join(process.cwd(), "uploads");
    const full = path.join(uploadsDir, path.basename(file.FILE_PATH || file.PATH || ""));
    if (!fs.existsSync(full)) return res.status(404).json({ message: "File not found" });
    const kind = file.KIND || kindFromName(full) || "PDF";
    const name = String(file.ORIGINAL_NAME || file.NAME || path.basename(full)).replace(/["\r\n]/g, "");
    res.setHeader("Content-Type", KINDS[kind]?.mime || "application/octet-stream");
    res.setHeader("Content-Disposition", `${kind === "PDF" ? "inline" : "attachment"}; filename="${name.replace(/[^\x20-\x7E]/g, "_")}"; filename*=UTF-8''${encodeURIComponent(name)}`);
    res.setHeader("X-Robots-Tag", "noindex");
    return res.sendFile(full);
};
