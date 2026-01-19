const sql = require("mssql");

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
};

const connectDB = async () => {
  try {
    await sql.connect(config);
    console.log("✅ MSSQL Connected");
  } catch (err) {
    console.error("❌ DB Connection Failed:", err.message);
  }
};

module.exports = { sql, connectDB };
