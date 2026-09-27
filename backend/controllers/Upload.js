import connection from "../database/mysql.js";
import AsyncHandler from "../utils/AsyncHandler.js";
import multer from "multer";
import path from "path";
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads')
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, file.fieldname + '-' + uniqueSuffix+".pdf")
    }
})

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, callback) => {
        const isPdf = path.extname(file.originalname).toLowerCase() === ".pdf" && file.mimetype === "application/pdf";
        callback(isPdf ? null : new Error("Only PDF files are supported"), isPdf);
    },
});
const uploadFiles = AsyncHandler(async(req, res) => {
    // console.log(req.body.title);
    const files = req.files;
    const { problemId, email, link, description, title } = req.body
    if (!files?.length) {
        return res.status(400).json({ message: "A PDF file is required" });
    }
    console.log(req.body);
    
    console.log(files[0].path);

    const [data, extra] = await connection.query("INSERT INTO submissions (PROBLEM_ID, TEAM_EMAIL, SOL_TITLE,SOL_DESCRIPTION,SUB_DATE, SOL_LINK, FILES) VALUES (?, ?, ?, ?, ?, ?, ?)", [problemId, email, title, description, new Date().toISOString().split('T')[0], link, files[0].path]);
    
    console.log(data);
    if (data) {
        
        res.send(true);
    }
    else {
        res.send(false);
    }

})

export { upload, uploadFiles }