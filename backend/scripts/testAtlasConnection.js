/**
 * JurisAI — MongoDB Atlas Cloud Database Diagnostic & Test Script
 * Run: node backend/scripts/testAtlasConnection.js
 * or:  npm run test:db
 */
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import mongoose from "mongoose";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend/ or root
const backendEnvPath = path.resolve(__dirname, "..", ".env");
const rootEnvPath = path.resolve(__dirname, "..", "..", ".env");

if (fs.existsSync(backendEnvPath)) {
  dotenv.config({ path: backendEnvPath });
} else if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
} else {
  dotenv.config();
}

import { validateMongoUri, maskMongoUri } from "../config/db.js";

async function runDiagnostic() {
  console.log("\n============================================================");
  console.log("       JurisAI — MongoDB Atlas Connection Diagnostic        ");
  console.log("============================================================\n");

  const rawUri = process.env.MONGO_URI;

  if (!rawUri) {
    console.error("❌ FAILED: MONGO_URI environment variable is missing.");
    console.log("\nAction required:");
    console.log("  1. Copy backend/.env.example to backend/.env (or .env in root)");
    console.log("  2. Add your MongoDB Atlas connection string:");
    console.log("     MONGO_URI=mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/jurisai?retryWrites=true&w=majority\n");
    process.exit(1);
  }

  console.log(`[1] Configuration Check:`);
  console.log(`    Target URI: ${maskMongoUri(rawUri)}`);

  const validation = validateMongoUri(rawUri);
  if (!validation.valid) {
    console.error(`\n❌ FAILED: ${validation.error}`);
    if (validation.tips) {
      console.log("\nHow to fix:");
      validation.tips.forEach((t) => console.log(`  👉 ${t}`));
    }
    console.log("");
    process.exit(1);
  }

  const isAtlas = rawUri.startsWith("mongodb+srv://");
  console.log(`    Protocol: ${isAtlas ? "Cloud MongoDB Atlas (SRV / TLS)" : "Standard MongoDB"}`);
  console.log(`    ✅ URI syntax format is valid.\n`);

  console.log(`[2] Attempting Live Cloud Connection...`);
  const startTime = Date.now();

  try {
    const conn = await mongoose.connect(rawUri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4,
    });

    const connectLatency = Date.now() - startTime;
    console.log(`    ✅ Connected successfully in ${connectLatency}ms!`);
    console.log(`    Connected Host: ${conn.connection.host}`);
    console.log(`    Database Name:  ${conn.connection.name}`);
    console.log(`    Ready State:    ${conn.connection.readyState === 1 ? "1 (Connected)" : conn.connection.readyState}`);

    console.log(`\n[3] Admin Ping & Latency Test...`);
    const pingStart = Date.now();
    await conn.connection.db.admin().ping();
    const pingLatency = Date.now() - pingStart;
    console.log(`    ✅ Cluster responded to ping in ${pingLatency}ms.`);

    console.log(`\n[4] Database Permissions Check (Listing Collections)...`);
    const collections = await conn.connection.db.listCollections().toArray();
    console.log(`    ✅ Collections retrieved successfully (${collections.length} found):`);
    if (collections.length === 0) {
      console.log("       (Database is fresh. Collections will be auto-created on first insert.)");
    } else {
      collections.forEach((col) => console.log(`       - ${col.name}`));
    }

    console.log("\n============================================================");
    console.log("🎉 SUCCESS: MongoDB Atlas database is ready for production!");
    console.log("============================================================\n");

    await mongoose.connection.close(false);
    process.exit(0);
  } catch (err) {
    console.error(`\n❌ FAILED: Could not connect to database.`);
    console.error(`   Error message: ${err.message}\n`);

    console.log("Common causes & troubleshooting steps:");
    if (err.message.includes("bad auth") || err.message.includes("Authentication failed")) {
      console.log("  🔑 AUTHENTICATION ERROR:");
      console.log("     - Verify that the username and password match your MongoDB Atlas Database User.");
      console.log("     - In MongoDB Atlas, go to: Security -> Database Access.");
      console.log("     - Make sure the user has 'Read and write to any database' or 'Built-in role: Atlas admin'.");
      console.log("     - If your password contains symbols (like '@', '#', '&', '%'), they MUST be URL-encoded.");
    } else if (
      err.message.includes("ETIMEOUT") ||
      err.message.includes("querySrv") ||
      err.message.includes("ENOTFOUND") ||
      err.message.includes("Server selection timed out")
    ) {
      console.log("  🌐 NETWORK / FIREWALL TIMEOUT:");
      console.log("     - In MongoDB Atlas, go to: Security -> Network Access.");
      console.log("     - Ensure IP Access List includes '0.0.0.0/0' (Allow access from anywhere).");
      console.log("     - If '0.0.0.0/0' is missing, Atlas drops all incoming connections from cloud hosts and new IPs.");
    } else {
      console.log("  ⚠️  GENERAL ERROR:");
      console.log("     - Double check your connection string in MongoDB Atlas: Database -> Connect -> Drivers -> Node.js.");
    }

    console.log("");
    process.exit(1);
  }
}

runDiagnostic();

