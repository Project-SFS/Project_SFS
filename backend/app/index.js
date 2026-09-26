import app from "./app.js";
import dotenv from "dotenv"
import connection from "../database/mysql.js";
import migrate from "../database/migrate.js";
dotenv.config()

const PORT = process.env.PORT

// Retry while the database comes up; exit if it never does so Docker restarts the container
const MIGRATION_ATTEMPTS = 10;
for (let attempt = 1; attempt <= MIGRATION_ATTEMPTS; attempt++) {
  try {
    await migrate();
    break;
  } catch (error) {
    console.error(`Database migration failed (attempt ${attempt}/${MIGRATION_ATTEMPTS}):`, error.message);
    if (attempt === MIGRATION_ATTEMPTS) process.exit(1);
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
}

app.listen(PORT || 8001 ,() => {
  console.log(`Backend server is running on port ${process.env.PORT}`);
});
