import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { CONNECTORS } from "./connectors/index";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app = express();
app.use(cors({ origin: ["http://localhost:8080", "http://localhost:5173"] }));
app.use(express.json());

// GET /api/sync/:provider?yearMonth=2026-05
app.get("/api/sync/:provider", async (req, res) => {
  const provider = req.params.provider.toLowerCase();
  const yearMonth = req.query.yearMonth as string;

  if (!yearMonth || !/^\d{4}-\d{2}$/.test(yearMonth)) {
    return res.status(400).json({ error: "yearMonth query param required (YYYY-MM)" });
  }

  const connector = CONNECTORS[provider];
  if (!connector) {
    return res.status(404).json({ error: `Unknown provider: ${provider}`, supported: false });
  }

  try {
    const result = await connector(yearMonth);
    return res.json(result);
  } catch (err: any) {
    if (err.code === "MISSING_API_KEY") {
      return res.status(503).json({
        error: err.message,
        code: "MISSING_API_KEY",
        supported: true,
      });
    }
    console.error(`[sync/${provider}]`, err.message);
    return res.status(502).json({
      error: `API call failed: ${err.message}`,
      code: "API_ERROR",
      supported: true,
    });
  }
});

// GET /api/providers — list which providers have real API support
app.get("/api/providers", (_req, res) => {
  const supported = ["openai", "anthropic", "elevenlabs", "assemblyai", "heygen"];
  const stubs = ["google", "replit", "lovable"];
  res.json({ supported, stubs });
});

const PORT = process.env.SERVER_PORT ?? 4040;
app.listen(PORT, () => console.log(`[server] listening on :${PORT}`));
