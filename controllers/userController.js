const  pool  = require("../db/pg-pool");
const bcrypt = require("bcrypt");
const { StatusCodes } = require("http-status-codes");

// ---------------- REGISTER ----------------
async function register(req, res) {
  const { name, email, password } = req.body;

  const existing = await pool.query(
    "SELECT * FROM users WHERE email = $1",
    [email]
  );

  if (existing.rows.length > 0) {
    return res.status(400).json({ message: "User already exists" });
  }

  const hashed = await bcrypt.hash(password, 10);

  const result = await pool.query(
    `INSERT INTO users (name, email, hashed_password)
     VALUES ($1, $2, $3)
     RETURNING id, name, email`,
    [name, email, hashed]
  );

  return res.status(201).json(result.rows[0]);
}

// ---------------- LOGON ----------------
async function logon(req, res) {
  const { email, password } = req.body;

  const result = await pool.query(
    "SELECT * FROM users WHERE email = $1",
    [email]
  );

  if (result.rows.length === 0) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const user = result.rows[0];

  const match = await bcrypt.compare(password, user.hashed_password);

  if (!match) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  return res.status(200).json({
    id: user.id,
    name: user.name,
    email: user.email,
  });
}


function logoff(req, res) {
  global.user_id = null;
  return res.status(200).json({ message: "Logged off" });
}

module.exports = {
  register,
  logon,
  logoff,
};