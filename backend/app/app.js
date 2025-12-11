import express from "express"
import cors from "cors"
import router from "../router/router.js"
import cookieParser from "cookie-parser"
import db from "../database/ms-sql.js"
// import app from ""
const app = express()
app.use(cors({
    origin:["http://localhost:5173", "http://localhost:5174"],
    credentials:true
}))

db.connectDB();

app.use(cookieParser())
app.use(express.json())
app.use(router)
export default app
