import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();



const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    options: {
        encrypt: true,
        trustServerCertificate: true,
    },
   port: 1433
};

let pool1;

const connectDB = async () => {
    try {
        const pool = await sql.connect(config);
        pool1 = pool;
        
        console.log("MS SQL Database connected successfully");
    }
    catch (error) {
        console.log(error);
        
        console.error('MS SQL connection error', error);
    }   
};

export {  connectDB, pool1 };
