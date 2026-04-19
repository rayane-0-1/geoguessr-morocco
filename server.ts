import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Serve game data
  app.get("/api/data/:type", (req, res) => {
    const { type } = req.params;
    const filePath = path.join(process.cwd(), "public", "data", `${type}.json`);
    
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, "utf-8");
      res.json(JSON.parse(data));
    } else {
      res.status(404).json({ error: "Data file not found" });
    }
  });

  // Mock Leaderboard API
  let leaderboard = [
    { name: "Youssef", score: 850, date: "2026-04-10" },
    { name: "Fatima", score: 720, date: "2026-04-12" },
    { name: "Mehdi", score: 680, date: "2026-04-15" }
  ];

  app.get("/api/leaderboard", (req, res) => {
    res.json(leaderboard.sort((a, b) => b.score - a.score));
  });

  app.post("/api/leaderboard", (req, res) => {
    const { name, score } = req.body;
    if (name && score !== undefined) {
      leaderboard.push({ name, score, date: new Date().toISOString() });
      res.status(201).json({ success: true });
    } else {
      res.status(400).json({ error: "Name and score are required" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Morocco Game Server] Running on http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);
