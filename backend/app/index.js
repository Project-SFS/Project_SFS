import app from "./app.js";
import dotenv from "dotenv"
import {connectDB} from "../database/ms-sql.js";
dotenv.config()

const PORT = process.env.PORT || 8000

app.listen(PORT  ,() => {
  console.log(`Backend server is running on port ${PORT}`);
});