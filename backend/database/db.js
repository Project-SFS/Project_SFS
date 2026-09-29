import sql from "mssql"
import dotenv from "dotenv"

dotenv.config()

const config = {
    server: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 1433,
    database: process.env.DB_NAME || "SakthiAuto",
    user: process.env.DB_USER || "sa",
    password: process.env.DB_PASSWORD,
    options: {
        encrypt: process.env.DB_ENCRYPT !== "false",
        // self-signed certificates are the norm for a SQL Server container / internal server
        trustServerCertificate: process.env.DB_TRUST_SERVER_CERT !== "false",
    },
    pool: {
        max: Number(process.env.DB_POOL_MAX) || 10,
        min: 0,
        idleTimeoutMillis: 30000,
    },
}

let poolPromise

// Connect lazily and forget a failed attempt, so the next query retries instead of reusing a dead pool
const getPool = () => {
    if (!poolPromise) {
        poolPromise = new sql.ConnectionPool(config).connect().catch((err) => {
            poolPromise = undefined
            throw err
        })
    }
    return poolPromise
}

/**
 * Run a query with `?` placeholders, returning results shaped like mysql2 so controllers stay simple:
 *   SELECT         -> [rows]
 *   INSERT         -> [{ insertId, affectedRows }]
 *   UPDATE/DELETE  -> [{ affectedRows }]
 */
const query = async (text, params = []) => {
    const pool = await getPool()
    const request = pool.request()

    let index = 0
    const sqlText = text.replace(/\?/g, () => {
        const value = params[index]
        request.input(`p${index}`, value === undefined ? null : value)
        return `@p${index++}`
    })
    if (index !== params.length) {
        throw new Error(`Query has ${index} placeholders but ${params.length} parameters were given`)
    }

    if (/^\s*insert\s/i.test(sqlText)) {
        const result = await request.query(`${sqlText}; SELECT CAST(SCOPE_IDENTITY() AS INT) AS insertId;`)
        return [{ insertId: result.recordset?.[0]?.insertId ?? null, affectedRows: result.rowsAffected[0] ?? 0 }]
    }

    const result = await request.query(sqlText)
    if (result.recordset) return [result.recordset]
    return [{ affectedRows: result.rowsAffected.reduce((sum, n) => sum + n, 0) }]
}

const ping = async () => {
    const pool = await getPool()
    await pool.request().query("SELECT 1")
}

const close = async () => {
    if (!poolPromise) return
    const pool = await poolPromise.catch(() => null)
    poolPromise = undefined
    if (pool) await pool.close()
}

const connection = { query, execute: query }

export { config, ping, close }
export default connection
