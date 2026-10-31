/**
 * JurisAI — Production-Grade MongoDB Atlas Database Connection
 * Configured with connection pooling, automatic reconnection,
 * secure credential masking, and live health ping.
 */
import mongoose from "mongoose";

/**
 * Masks credentials in a MongoDB connection string for safe log output.
 * e.g. "mongodb+srv://user:secret123@cluster0.abc.mongodb.net/jurisai"
 *   -> "mongodb+srv://user:******@cluster0.abc.mongodb.net/jurisai"
 */
export const maskMongoUri = (uri) => {
  if (!uri || typeof uri !== "string") return "<undefined>";
  try {
    return uri.replace(/:([^:@]+)@/, ":******@");
  } catch {
    return "<redacted>";
  }
};

/**
 * Validates the MongoDB URI and checks for common configuration mistakes.
 */
export const validateMongoUri = (rawUri) => {
  if (!rawUri || typeof rawUri !== "string" || rawUri.trim().length === 0) {
    return {
      valid: false,
      error: "MONGO_URI is missing or empty in environment variables.",
      tips: [
        "Create or update .env in backend/ or root folder.",
        "Set MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/jurisai?retryWrites=true&w=majority",
      ],
    };
  }

  const uri = rawUri.trim();

  // Check for unreplaced template placeholders
  if (uri.includes("<password>") || uri.includes("<username>") || uri.includes("<dbname>")) {
    return {
      valid: false,
      error: "MONGO_URI contains unreplaced template placeholders (<password>, <username>, etc.).",
      tips: [
        "Replace '<password>' with your actual MongoDB Atlas database user password.",
        "Do not keep the angle brackets '<>' around your password.",
      ],
    };
  }

  // Check valid protocol
  if (!uri.startsWith("mongodb://") && !uri.startsWith("mongodb+srv://")) {
    return {
      valid: false,
      error: "Invalid MONGO_URI protocol. Must start with 'mongodb://' or 'mongodb+srv://'.",
      tips: [
        "MongoDB Atlas cloud connections typically use: mongodb+srv://...",
        "Self-hosted or local MongoDB uses: mongodb://localhost:27017/jurisai",
      ],
    };
  }

  // Check for unencoded special characters in password
  // In mongodb:// or mongodb+srv://, the userinfo is between :// and @
  const userinfoMatch = uri.match(/^mongodb(?:\+srv)?:\/\/([^@]+)@/);
  if (userinfoMatch) {
    const userinfo = userinfoMatch[1];
    const firstColon = userinfo.indexOf(":");
    if (firstColon !== -1) {
      const password = userinfo.slice(firstColon + 1);
      // Check if password has unencoded special chars that break URI parsing
      if (/[#%&+,/:;=?@]/.test(password)) {
        // If it looks like raw unencoded symbols, warn
        console.warn(
          "⚠️  [Database Warning] Your MongoDB password may contain unencoded special characters.",
          "If connection fails with an authentication error, please URL-encode special characters (e.g. '@' -> '%40', '#' -> '%23')."
        );
      }
    }
  }

  return { valid: true, uri };
};

let isConnected = false;

// Setup event listeners on Mongoose connection
mongoose.connection.on("connected", () => {
  isConnected = true;
  console.log(`✅ [Database] MongoDB connection established [Host: ${mongoose.connection.host}, DB: ${mongoose.connection.name}]`);
});

mongoose.connection.on("disconnected", () => {
  isConnected = false;
  console.warn("⚠️  [Database Warning] MongoDB disconnected. Auto-reconnect in progress...");
});

mongoose.connection.on("reconnected", () => {
  isConnected = true;
  console.log("🔄 [Database] MongoDB reconnected successfully.");
});

mongoose.connection.on("error", (err) => {
  console.error("❌ [Database Event Error]:", err.message);
});

/**
 * Connect to MongoDB / MongoDB Atlas with production options.
 * @param {number} retryCount
 */
export const connectDB = async (retryCount = 0) => {
  const rawUri = process.env.MONGO_URI || "mongodb://localhost:27017/jurisai";
  const validation = validateMongoUri(rawUri);

  if (!validation.valid) {
    console.error(`\n❌ [Database Configuration Error]: ${validation.error}`);
    if (validation.tips) {
      validation.tips.forEach((tip) => console.error(`   👉 ${tip}`));
    }
    if (process.env.NODE_ENV === "production") {
      throw new Error(`MongoDB Configuration Error: ${validation.error}`);
    }
  }

  const uri = validation.uri || rawUri;
  const isAtlas = uri.startsWith("mongodb+srv://");

  const options = {
    serverSelectionTimeoutMS: parseInt(process.env.MONGO_SERVER_SELECTION_TIMEOUT || "10000", 10),
    socketTimeoutMS: parseInt(process.env.MONGO_SOCKET_TIMEOUT || "45000", 10),
    maxPoolSize: parseInt(process.env.MONGO_MAX_POOL_SIZE || "10", 10),
    minPoolSize: parseInt(process.env.MONGO_MIN_POOL_SIZE || "2", 10),
    autoIndex: process.env.NODE_ENV !== "production", // Disable auto-indexing in production for performance
    family: 4, // Force IPv4 to avoid DNS delays on dual-stack cloud providers
  };

  try {
    console.log(`[Database] Connecting to ${isAtlas ? "Cloud MongoDB Atlas" : "MongoDB"} at: ${maskMongoUri(uri)}...`);
    const conn = await mongoose.connect(uri, options);
    isConnected = true;
    return conn;
  } catch (err) {
    isConnected = false;
    console.error(`\n❌ [Database Connection Error]: ${err.message}`);

    // Print helpful diagnostic advice
    if (err.message.includes("bad auth") || err.message.includes("Authentication failed")) {
      console.error("   👉 Authentication Failed: Check your MongoDB Atlas Database Access user and password.");
    } else if (
      err.message.includes("ETIMEOUT") ||
      err.message.includes("querySrv") ||
      err.message.includes("ENOTFOUND") ||
      err.message.includes("Server selection timed out")
    ) {
      console.error("   👉 Network / Firewall Timeout: Ensure MongoDB Atlas 'Network Access' allows your IP (0.0.0.0/0 for cloud hosts).");
    }

    const maxRetries = process.env.NODE_ENV === "production" ? 5 : 2;
    if (retryCount < maxRetries) {
      const delayMs = Math.min(Math.pow(2, retryCount) * 1500, 10000);
      console.log(`   ⏳ Retrying in ${delayMs / 1000}s (Attempt ${retryCount + 1}/${maxRetries})...\n`);
      await new Promise((res) => setTimeout(res, delayMs));
      return connectDB(retryCount + 1);
    }

    if (process.env.NODE_ENV === "production") {
      throw err;
    }
    console.warn("⚠️  [Database Notice] Running in offline/disconnected mode for local development.\n");
  }
};

/**
 * Tests database connectivity and measures roundtrip ping latency.
 * @returns {Promise<{ ok: boolean, state: string, latencyMs: number|null, host: string|null, database: string|null }>}
 */
export const pingDB = async () => {
  const states = ["disconnected", "connected", "connecting", "disconnecting"];
  const readyState = mongoose.connection.readyState;
  const stateStr = states[readyState] || "unknown";

  if (readyState !== 1 || !mongoose.connection.db) {
    return {
      ok: false,
      state: stateStr,
      latencyMs: null,
      host: null,
      database: null,
    };
  }

  try {
    const start = Date.now();
    await mongoose.connection.db.admin().ping();
    const latencyMs = Date.now() - start;
    return {
      ok: true,
      state: stateStr,
      latencyMs,
      host: mongoose.connection.host,
      database: mongoose.connection.name,
    };
  } catch (err) {
    return {
      ok: false,
      state: stateStr,
      latencyMs: null,
      error: err.message,
      host: mongoose.connection.host,
      database: mongoose.connection.name,
    };
  }
};

/**
 * Disconnects from MongoDB cleanly.
 */
export const disconnectDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close(false);
    isConnected = false;
  }
};

