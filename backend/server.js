require("dotenv").config();
const { assertEnv } = require("./src/config/env");
assertEnv(); // Fail fast if required env vars are missing

const app = require("./src/app");
const db = require("./src/config/db");

const PORT = parseInt(process.env.PORT || "3000", 10);

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`[server] Listening on 0.0.0.0:${PORT} (${process.env.NODE_ENV || "development"})`);
});

// ── Graceful shutdown (SIGTERM from k8s / Docker stop) ───────────────────────
async function shutdown(signal) {
  console.log(`[server] ${signal} received — shutting down gracefully`);
  server.close(async () => {
    try {
      await db.destroy(); // drain the pg connection pool
      console.log("[server] DB pool closed. Exiting.");
      process.exit(0);
    } catch (err) {
      console.error("[server] Error during DB pool drain:", err);
      process.exit(1);
    }
  });

  // Hard kill if not done within 10 s (prevents a pod hanging on shutdown)
  setTimeout(() => {
    console.error("[server] Forced exit after timeout");
    process.exit(1);
  }, 10_000);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

process.on("unhandledRejection", (reason) => {
  console.error("[server] Unhandled rejection:", reason);
});
