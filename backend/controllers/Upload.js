import AsyncHandler from "../utils/AsyncHandler.js";
import multer from "multer"
const storage = multer.diskStorage({
    limits: { fileSize: 10 * 1000  },
    destination: function (req, file, cb) {
        cb(null, 'uploads')
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, file.fieldname + '-' + uniqueSuffix)
    }
})

const upload = multer({ storage: storage })
const uploadFiles = AsyncHandler((req, res) => {
    const files = req.files;

    console.log(files[0].path);
    res.send(files[0].path)
})

export { upload, uploadFiles }