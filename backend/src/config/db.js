const knex = require("knex");
const { dbConfig } = require("./env");

const db = knex({
  client: "pg",
  connection: dbConfig(),
  pool: {
    min: 2,
    max: 10,
    // Tune acquireTimeoutMillis here if the database is slow to accept connections.
  },
  // Return JS Date objects instead of strings for timestamp columns
  wrapIdentifier: (value, origImpl) => origImpl(value),
});

module.exports = db;
