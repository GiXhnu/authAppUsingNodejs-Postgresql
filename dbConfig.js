require('dotenv').config(); //loads environment variables from a .env file into the process.env object.

const { Pool } = require('pg');

const isProduction = process.env.NODE_ENV === "production";  //variable with a boolean value
const connectionString = `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_DATABASE}`

const pool = new Pool({
  connectionString: isProduction? process.env.DATABASE_URL : connectionString
});

module.exports = { pool }; //exports the pool variable from the current module.
