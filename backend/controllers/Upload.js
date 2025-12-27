import connection from "../database/mysql.js";
import AsyncHandler from "../utils/AsyncHandler.js";
import multer from "multer"
const storage = multer.diskStorage({
    limits: { fileSize: 10 * 1000 },
    destination: function (req, file, cb) {
        cb(null, 'uploads')
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, file.fieldname + '-' + uniqueSuffix + ".pdf")
    }
})

const upload = multer({ storage: storage })
const uploadFiles = AsyncHandler(async (req, res) => {
    // console.log(req.body.title);
    const files = req.files;
    const { problemId, email, link, description, title } = req.body
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