const express = require("express");
const mysql = require("mysql2/promise");

const app = express();
const port = 3000;

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10
});

app.get("/health", async (_request, response) => {
  try {
    await pool.query("SELECT 1");
    response.json({ status: "ok" });
  } catch (error) {
    response.status(503).json({ status: "database-unavailable" });
  }
});

app.get("/api/products", async (_request, response) => {
  try {
    const [products] = await pool.query(
      "SELECT id, name, category, price FROM products ORDER BY id"
    );
    response.json(products);
  } catch (error) {
    console.error("Unable to query products:", error.message);
    response.status(500).json({ error: "Unable to load products." });
  }
});

app.listen(port, () => {
  console.log(`Node API listening on port ${port}`);
});
