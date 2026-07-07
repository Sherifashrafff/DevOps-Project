// Validates required env vars at startup so the process fails fast with a clear message
// rather than crashing mid-request with an obscure undefined error.
const required = ["JWT_SECRET"];

function assertEnv() {
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) {
    console.error(`[env] Missing required environment variables: ${missing.join(", ")}`);
    process.exit(1);
  }
  if (process.env.JWT_SECRET.length < 32) {
    console.error("[env] JWT_SECRET must be at least 32 characters");
    process.exit(1);
  }
}

// Returns a knex-compatible connection object.
// DATABASE_URL takes precedence over individual vars (one env var for the whole DSN).
function dbConfig() {
  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
    };
  }
  return {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432", 10),
    database: process.env.DB_NAME || "taskflow",
    user: process.env.DB_USER || "taskflow_user",
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
  };
}

module.exports = { assertEnv, dbConfig };
