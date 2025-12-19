import express from "express"
import cors from "cors"
import router from "../router/router.js"
import cookieParser from "cookie-parser"
import path from "path";
// import app from ""
const app = express()
// when deployed behind a proxy (like Render), enable trust proxy so
// Express knows the connection is secure (useful for cookies and req.protocol)
app.set('trust proxy', 1)
app.use(cors({
    origin: ["http://localhost:5173", "http://localhost:5174", "https://project-sfs.onrender.com"],
    credentials: true
}))

app.use(
    "/uploads",
    express.static(path.join(process.cwd(), "uploads"))
);
app.use(cookieParser())
app.use(express.json())
app.use(router)
export default app
