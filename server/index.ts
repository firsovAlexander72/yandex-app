import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { reportRouter } from "./routes/report";
import { telegramRouter } from "./routes/telegram";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  app.get("/health", (_req, res) => res.status(200).send("ok"));

  app.use("/api/report", reportRouter);
  app.use("/api/telegram", telegramRouter);

  return app;
}
