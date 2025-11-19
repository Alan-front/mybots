import express from "express";
import cors from "cors";
import pool from "./db.js";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(
  cors({
    origin: "https://mybots-1.onrender.com",
  })
);

app.use(express.json());

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
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
      return res.status(404).json({ error: "bot no encontrado" });
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

    let dominiosArray = allowed_domains || [];

    if (typeof dominiosArray === "string") {
      dominiosArray = dominiosArray
        .split(",")
        .map((d) => d.trim())
        .filter((d) => d.length > 0);
    }

    if (!Array.isArray(dominiosArray)) dominiosArray = [];

    const result = await pool.query(
      `insert into bots 
      (nombre, token, prompt_base, tipo, tema, provider, allowed_domains)
      values ($1, $2, $3, $4, $5, $6, $7)
      returning *`,
      [
        nombre,
        token,
        prompt_base,
        tipo,
        tema,
        provider || "groq",
        JSON.stringify(dominiosArray),
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
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
      `update bots 
      set nombre = $1,
          token = $2,
          prompt_base = $3,
          tipo = $4,
          tema = $5,
          provider = $6,
          allowed_domains = $7
      where id = $8
      returning *`,
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
      return res.status(404).json({ error: "bot no encontrado" });
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
      "delete from bots where id = $1 returning *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "bot no encontrado" });
    }

    res.json({ message: "bot eliminado" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(PORT, () => {
  console.log(`server en puerto ${PORT}`);
});
