import app from "./app.js";
import dotenv from "dotenv"
import connection from "../database/mysql.js";
dotenv.config()

const PORT = process.env.PORT

app.listen(PORT || 8001 ,() => {
  console.log(`Backend server is running on port ${process.env.PORT}`);
});