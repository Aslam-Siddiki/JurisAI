/**
 * JurisAI — Production Security & Rate Limiting Middleware
 * Zero external dependency implementation suitable for production environments.
 */
import multer from "multer";

// In-memory sliding-window bucket store for rate limiting
const ipHits = new Map();

// Periodic cleanup of stale rate-limit buckets (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of ipHits.entries()) {
    if (now > record.resetTime) {
      ipHits.delete(key);
    }
  }
}, 5 * 60 * 1000).unref();

/**
 * Creates an in-memory rate limiter middleware
 * @param {Object} options
 * @param {number} options.windowMs - Window duration in milliseconds
 * @param {number} options.max - Max allowed requests per window
 * @param {string} options.message - Error message returned on 429
 */
export const createRateLimiter = ({
  windowMs = 60 * 1000,
  max = 100,
  message = "Too many requests from this IP. Please try again shortly.",
}) => {
  return (req, res, next) => {
    // In production behind proxies, prefer x-forwarded-for; fallback to socket remoteAddress
    const forwarded = req.headers["x-forwarded-for"];
    const ip = (forwarded ? forwarded.split(",")[0].trim() : req.socket?.remoteAddress) || "unknown";
    const bucketKey = `${req.baseUrl || req.path}:${ip}`;
    const now = Date.now();

    let record = ipHits.get(bucketKey);
    if (!record || now > record.resetTime) {
      record = { count: 1, resetTime: now + windowMs };
      ipHits.set(bucketKey, record);
      res.setHeader("X-RateLimit-Limit", max);
      res.setHeader("X-RateLimit-Remaining", max - 1);
      return next();
    }

    record.count += 1;
    const remaining = Math.max(0, max - record.count);
    res.setHeader("X-RateLimit-Limit", max);
    res.setHeader("X-RateLimit-Remaining", remaining);

    if (record.count > max) {
      const retryAfterSec = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader("Retry-After", retryAfterSec);
      return res.status(429).json({
        error: message,
        retryAfterSeconds: retryAfterSec,
      });
    }

    next();
  };
};

// Specialized Rate Limiters
export const authRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 15, // 15 attempts/min per IP
  message: "Too many authentication attempts. Please wait 1 minute before trying again.",
});

export const evalRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 6, // 6 evaluation triggers/min
  message: "AI Evaluation rate limit exceeded. Please wait a minute before re-triggering.",
});

export const apiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 150, // 150 requests/min per IP
  message: "API request rate limit exceeded. Please slow down.",
});

/**
 * Applies production-grade HTTP security headers
 */
export const securityHeaders = (req, res, next) => {
  res.removeHeader("X-Powered-By");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  // If running on HTTPS in production, enforce HSTS
  if (req.secure || req.headers["x-forwarded-proto"] === "https") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  }

  next();
};

/**
 * Production-ready CORS origin checker
 */
export const getCorsOptions = () => {
  const isProd = process.env.NODE_ENV === "production";

  // Parse allowed origins from environment
  const configuredOrigins = [
    process.env.CLIENT_URL,
    ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(",").map((s) => s.trim()) : []),
  ].filter(Boolean);

  const devOrigins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ];

  const allowedOrigins = isProd
    ? configuredOrigins
    : Array.from(new Set([...configuredOrigins, ...devOrigins]));

  return {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin) return callback(null, true);

      // In development, be permissive to facilitate local testing
      if (!isProd) {
        if (allowedOrigins.includes(origin) || origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:")) {
          return callback(null, true);
        }
        return callback(null, true); // Permissive in dev
      }

      // In production, strictly match configured origins, allow wildcards or vercel.app domains
      if (
        allowedOrigins.includes("*") ||
        allowedOrigins.includes(origin) ||
        origin.endsWith(".vercel.app") ||
        allowedOrigins.some((allowed) => {
          if (allowed.startsWith("*.")) {
            return origin.endsWith(allowed.slice(1));
          }
          return allowed === origin;
        })
      ) {
        return callback(null, true);
      }

      console.warn(`[CORS Blocked] Origin not authorized: ${origin}`);
      return callback(new Error(`CORS blocked for unauthorized origin: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Service-Key"],
  };
};

/**
 * Handles Multer upload errors gracefully with clean JSON responses.
 */
export const handleUploadErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "File exceeds maximum size of 10MB." });
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({ error: "Cannot upload more than 5 files per submission." });
    }
    return res.status(400).json({ error: `File upload error: ${err.message}` });
  } else if (err) {
    return res.status(400).json({ error: err.message || "File upload failed." });
  }
  next();
};
