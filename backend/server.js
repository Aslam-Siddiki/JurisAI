/**
 * JurisAI — Backend Server (Production-Ready)
 * Modular Express API with MongoDB Atlas resilience, security middleware,
 * rate limiting, health probes, and production static build serving.
 */
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import mongoose from "mongoose";

import { connectDB, pingDB } from "./config/db.js";
import {
  securityHeaders,
  apiRateLimiter,
  getCorsOptions,
} from "./middleware/security.js";
import { UPLOAD_DIR } from "./middleware/upload.js";

import authRoutes from "./routes/authRoutes.js";
import caseRoutes from "./routes/caseRoutes.js";
import submissionRoutes from "./routes/submissionRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables (.env from backend or root)
const backendEnv = path.resolve(__dirname, ".env");
const rootEnv = path.resolve(__dirname, "..", ".env");
if (fs.existsSync(backendEnv)) {
  dotenv.config({ path: backendEnv });
} else if (fs.existsSync(rootEnv)) {
  dotenv.config({ path: rootEnv });
} else {
  dotenv.config();
}

const app = express();
const PORT = process.env.PORT || 5000;
const isProd = process.env.NODE_ENV === "production";

// Enable reverse proxy trust for accurate IP resolution behind Cloudflare, Render, AWS ALB, Nginx
app.set("trust proxy", 1);

// Production Security Headers
app.use(securityHeaders);

// Production CORS configuration
app.use(cors(getCorsOptions()));

// Body Parsers with safe size limits
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// General API Rate Limiter
app.use("/api/", apiRateLimiter);

// Static folder for uploaded evidence files
app.use("/uploads", express.static(UPLOAD_DIR));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/cases", caseRoutes);
app.use("/api/cases/:id/submission", submissionRoutes);

// Health Check Endpoint (Cloud Orchestrators & Monitoring)
app.get("/api/health", async (req, res) => {
  const dbPing = await pingDB();
  const dbState = mongoose.connection.readyState;
  const states = ["disconnected", "connected", "connecting", "disconnecting"];
  const isDbHealthy = dbState === 1;

  const mem = process.memoryUsage();
  const healthData = {
    status: isDbHealthy ? "ok" : "degraded",
    service: "JurisAI Backend API",
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development",
    uptimeSeconds: Math.floor(process.uptime()),
    database: {
      status: states[dbState] || "unknown",
      connected: isDbHealthy,
      host: mongoose.connection.host || null,
      name: mongoose.connection.name || null,
      latencyMs: dbPing.latencyMs,
    },
    system: {
      memoryUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
      memoryRssMB: Math.round(mem.rss / 1024 / 1024),
      nodeVersion: process.version,
    },
    timestamp: new Date().toISOString(),
  };

  // HTTP 200 if DB is healthy; HTTP 503 Service Unavailable if DB is disconnected
  res.status(isDbHealthy ? 200 : 503).json(healthData);
});

// Root API info endpoint
app.get("/api", (req, res) => {
  res.status(200).json({
    service: "JurisAI API Gateway",
    version: "1.0.0",
    documentation: "https://github.com/jurisai",
    endpoints: {
      auth: "/api/auth",
      cases: "/api/cases",
      health: "/api/health",
    },
  });
});

// Optional: Serve Frontend Single-Page Application (SPA) in unified production deployment
const frontendDistPath = path.resolve(__dirname, "../frontend/dist");
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));

  // Client-side routing fallback: serve index.html for non-API & non-upload GET requests
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) {
      return next();
    }
    res.sendFile(path.join(frontendDistPath, "index.html"));
  });
} else {
  // If no frontend dist is present, fallback for root
  app.get("/", (req, res) => {
    res.send({
      message: "JurisAI API Gateway is running.",
      health: "/api/health",
      frontend: "Frontend is hosted separately or not yet built (run npm run build:frontend).",
    });
  });
}

// 404 Handler for undefined API routes
app.use("/api/*", (req, res) => {
  res.status(404).json({
    error: `API endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global Centralized Error Handling Middleware
app.use((err, req, res, next) => {
  const statusCode = err.status || err.statusCode || 500;
  console.error(`[Unhandled Server Error] ${req.method} ${req.url}:`, err.message || err);

  const errorResponse = {
    error: err.message || "Internal server error.",
  };

  if (!isProd) {
    errorResponse.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
});

// Start HTTP Server
const server = app.listen(PORT, () => {
  console.log(`\n============================================================`);
  console.log(`🚀 JurisAI Backend Server running on port ${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`   Uploads:     ${UPLOAD_DIR}`);
  console.log(`============================================================\n`);
});

// Initiate Database Connection to MongoDB / Atlas
connectDB().catch((err) => {
  console.warn(`[Database Startup Notice]: Initial connection could not be established (${err.message}). Background retries will continue.`);
});

// Graceful Shutdown Handling (for Docker, Kubernetes, Render, Railway, AWS ECS)
const gracefulShutdown = async (signal) => {
  console.log(`\n[Shutdown] Received ${signal}. Starting graceful shutdown...`);

  server.close(async () => {
    console.log("[Shutdown] HTTP server stopped accepting new connections.");
    try {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close(false);
        console.log("[Shutdown] MongoDB Atlas connection closed cleanly.");
      }
      process.exit(0);
    } catch (dbErr) {
      console.error("[Shutdown Error] Failed to close database cleanly:", dbErr.message);
      process.exit(1);
    }
  });

  // Force close if graceful cleanup takes more than 10 seconds
  setTimeout(() => {
    console.error("[Shutdown] Forcefully exiting after 10-second timeout.");
    process.exit(1);
  }, 10000).unref();
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Process-level uncaught exception handlers
process.on("uncaughtException", (err) => {
  console.error("FATAL: Uncaught Exception:", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Promise Rejection:", reason);
});
