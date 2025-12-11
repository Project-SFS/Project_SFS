import AsyncHandler from "../utils/AsyncHandler.js"

const UploadFiles = AsyncHandler(async (req, res) => {
    console.log(req.body);
    
    const file = req.files[0];
    res.send(file.path)
})

export {UploadFiles}