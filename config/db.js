const { neon } = require("@neondatabase/serverless");
require("dotenv").config();

if (!process.env.DATABASE_URL) {
  throw new Error("❌ DATABASE_URL no está definida en el archivo .env");
}

const sql = neon(process.env.DATABASE_URL);

const testConnection = async () => {
  try {
    await sql`SELECT 1`;
    console.log("✅ Conectado a Neon (PostgreSQL)");
  } catch (err) {
    console.error("❌ Error de conexión a Neon:", err.message);
    process.exit(1);
  }
};

module.exports = { sql, testConnection };
