
const { Pool, types } = require("pg");

types.setTypeParser(1114, (value) => {
  if (value === null) return null;
  return new Date(`${String(value).replace(" ", "T")}Z`);
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

pool.on("connect", () => {
  console.log("Connected to Neon PostgreSQL");
});

pool.on("error", (err) => {
  console.error("Unexpected database error:", err);
});

module.exports = pool;

