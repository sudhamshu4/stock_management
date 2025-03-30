const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
const bcrypt = require("bcrypt"); // For password hashing
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// ✅ MariaDB Connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "12354",
  database: "stockmanage",
  port: 3307,
});

db.connect((err) => {
  if (err) {
    console.error("Database connection failed: " + err.stack);
    return;
  }
  console.log("Connected to MariaDB!");
});

// ✅ API: Fetch all users (Test route)
app.get("/users", (req, res) => {
  db.query("SELECT * FROM user_master", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// ✅ API: User Signup

app.post("/signup", async (req, res) => {
  const { userid, username, password, role } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const sql = `INSERT INTO user_master (userid, username, password, status, roles) VALUES (?, ?, ?, 'active', ?)`;
    db.query(sql, [userid, username, hashedPassword, role], (err, result) => {
      if (err) {
        console.log(err);
        // ✅ Handle Duplicate Entry Error
        if (err.code === "ER_DUP_ENTRY") {
          return res
            .status(400)
            .json({ error: "User ID or Username already exists" });
        }
        // ✅ For other errors, send the actual SQL error
        return res.status(400).json({ error: err.sqlMessage });
      }
      res.json({ message: "User registered successfully" });
    });
  } catch (err) {
    res.status(500).json({ error: "Server Error" });
  }
});

// ✅ API: User Login
app.post("/login", (req, res) => {
  const { userid, password } = req.body;
  const sql = `SELECT * FROM user_master WHERE userid = ?`;

  db.query(sql, [userid], async (err, results) => {
    if (err || results.length === 0)
      return res.status(401).json({ error: "Invalid user ID or password" });

    const isMatch = await bcrypt.compare(password, results[0].password);
    if (!isMatch) return res.status(401).json({ error: "Incorrect password" });

    res.json({ message: "Login successful", user: results[0] });
  });
});

// ✅ Start the Server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

app.get("/api/get-pr-number", (req, res) => {
  const prNumber = `PR-${Math.floor(1000 + Math.random() * 9000)}`;
  console.log("Generated PR Number:", prNumber); // ✅ Debug log
  res.json({ prNumber });
});
