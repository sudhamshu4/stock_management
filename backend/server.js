const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json()); // Allows JSON data in requests

// 📌 MariaDB Connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root", // Change if needed
  password: "12354", // Add your MariaDB password
  database: "tabstud", // Change to your database name
});

db.connect((err) => {
  if (err) {
    console.error("Database connection failed: " + err.stack);
    return;
  }
  console.log("Connected to MariaDB!");
});

// 📌 API Endpoint - Fetch Users
app.get("/users", (req, res) => {
  db.query("SELECT * FROM users", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// 📌 Start the Server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
