import express from "express";
import cors from "cors";
import pool from "./db.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(
  cors({
    origin: [
      "https://mybots-1.onrender.com",
      "https://mybots-mwf4.onrender.com",
    ],
    credentials: false,
  })
);

app.use(express.json());

app.use((req, res, next) => {
  console.log(`\n========================================`);
  console.log(`${req.method} ${req.url}`);
  console.log("Headers:", req.headers);
  console.log("Body:", req.body);
  console.log(`========================================\n`);
  next();
});

app.get("/api/bots", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM bots ORDER BY id DESC");
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/bots/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM bots WHERE id = $1", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Bot no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/bots", async (req, res) => {
  try {
    const {
      nombre,
      token,
      prompt_base,
      tipo,
      tema,
      provider,
      allowed_domains,
    } = req.body;

    if (!nombre || !token) {
      return res.status(400).json({ error: "Nombre y token requeridos" });
    }

    let dominiosArray = allowed_domains || [];

    if (typeof dominiosArray === "string") {
      dominiosArray = dominiosArray
        .split(",")
        .map((d) => d.trim())
        .filter((d) => d.length > 0);
    }

    if (!Array.isArray(dominiosArray)) dominiosArray = [];

    const result = await pool.query(
      `INSERT INTO bots 
      (nombre, token, prompt_base, tipo, tema, provider, allowed_domains)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        nombre,
        token,
        prompt_base || "",
        tipo || "general",
        tema || "",
        provider || "groq",
        JSON.stringify(dominiosArray),
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error POST:", error);
    res.status(500).json({ error: error.message, detail: error.detail });
  }
});

app.put("/api/bots/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nombre,
      token,
      prompt_base,
      tipo,
      tema,
      provider,
      allowed_domains,
    } = req.body;

    let dominiosArray = allowed_domains || [];

    if (typeof dominiosArray === "string") {
      dominiosArray = dominiosArray
        .split(",")
        .map((d) => d.trim())
        .filter((d) => d.length > 0);
    }

    if (!Array.isArray(dominiosArray)) dominiosArray = [];

    const result = await pool.query(
      `UPDATE bots 
      SET nombre = $1,
          token = $2,
          prompt_base = $3,
          tipo = $4,
          tema = $5,
          provider = $6,
          allowed_domains = $7
      WHERE id = $8
      RETURNING *`,
      [
        nombre,
        token,
        prompt_base,
        tipo,
        tema,
        provider,
        JSON.stringify(dominiosArray),
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Bot no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/bots/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "DELETE FROM bots WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Bot no encontrado" });
    }

    res.json({ message: "Bot eliminado" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor en puerto ${PORT}`);
});
