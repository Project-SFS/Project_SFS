import connection from "../database/mysql.js";
import AsyncHandler from "../utils/AsyncHandler.js";
import multer from "multer";

/* ====================== MULTER CONFIG ====================== */

const storage = multer.diskStorage({
    limits: { fileSize: 10 * 1000 },
    destination: function (req, file, cb) {
        cb(null, "uploads");
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + "-" + uniqueSuffix + ".pdf");
    }
});

const upload = multer({ storage });

/* ====================== UPLOAD FILES ====================== */

const uploadFiles = AsyncHandler(async (req, res) => {
    try {
        const files = req.files;
        const { problemId, email, link, description, title } = req.body;

        if (!files || files.length === 0) {
            return res.send(false);
        }

        const filePath = files[0].path;
        const subDate = new Date().toISOString().split("T")[0];

        await connection.query(
            `
            INSERT INTO submissions
            (PROBLEM_ID, TEAM_EMAIL, SOL_TITLE, SOL_DESCRIPTION, SUB_DATE, SOL_LINK, FILES)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            `,
            [problemId, email, title, description, subDate, link, filePath]
        );

        // ✅ If we reach here → insert succeeded
        res.send(true);

    } catch (error) {
        console.error("Upload insert failed:", error);
        res.send(false);
    }
});

/* ====================== EXPORTS ====================== */

export { upload, uploadFiles };
