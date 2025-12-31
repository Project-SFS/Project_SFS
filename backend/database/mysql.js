import sql from "mssql";
import dotenv from "dotenv";

dotenv.config();

/* ---------- MSSQL POOL ---------- */
const pool = await sql.connect({
    server: process.env.DB_HOST || "localhost",
    database: process.env.DB_NAME || "AppDB",
    user: process.env.DB_USER || "sa",
    password: process.env.DB_PASSWORD || "StrongPass@123",
    port: Number(process.env.DB_PORT) || 1433,
    options: {
        encrypt: true,
        trustServerCertificate: true
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
});

/* ---------- MySQL-compatible wrapper ---------- */
const connection = {
    async query(query, params = []) {
        const request = pool.request();

        // bind params (? → @p0, @p1, ...)
        params.forEach((val, i) => {
            request.input(`p${i}`, val);
        });

        let index = 0;
        const formattedQuery = query.replace(/\?/g, () => `@p${index++}`);

        const result = await request.query(formattedQuery);
        return [result.recordset];
    },

    async getConnection() {
        return {
            release() { } // noop (to keep existing code safe)
        };
    }
};

/* ---------- Connection Test (unchanged behavior) ---------- */
try {
    await pool.request().query("SELECT 1");
    console.log("MSSQL Connected");
} catch (error) {
    console.error("MSSQL connection error", error);
}

export default connection;
