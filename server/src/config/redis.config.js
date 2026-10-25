import Redis from "ioredis";

// In-memory fallback blacklist for environments without a running Redis server
const memoryBlacklist = new Map();

// Periodic cleanup of expired entries in memory blacklist
setInterval(() => {
  const now = Date.now();
  for (const [key, expiresAt] of memoryBlacklist.entries()) {
    if (expiresAt <= now) {
      memoryBlacklist.delete(key);
    }
  }
}, 60 * 1000).unref();

let redis = null;
let isRedisConnected = false;
const isRedisConfigured = Boolean(process.env.REDIS_HOST || process.env.REDIS_URL);

if (isRedisConfigured) {
  try {
    if (process.env.REDIS_URL) {
      redis = new Redis(process.env.REDIS_URL, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
      });
    } else {
      redis = new Redis({
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
      });
    }

    redis.on("connect", () => {
      isRedisConnected = true;
      console.log("Redis connected successfully");
    });

    redis.on("ready", () => {
      isRedisConnected = true;
    });

    redis.on("error", (err) => {
      isRedisConnected = false;
      console.error("Redis connection error:", err.message);
    });

    redis.on("close", () => {
      isRedisConnected = false;
    });

    // Attempt non-blocking connection
    redis.connect().catch((err) => {
      console.warn("Initial Redis connection failed, fallback will be used:", err.message);
    });
  } catch (err) {
    console.warn("Failed to initialize Redis client, fallback active:", err.message);
  }
}

/**
 * Blacklist a token for a given TTL in seconds
 */
export const blacklistToken = async (token, expiresInSeconds = 24 * 60 * 60) => {
  if (!token) return;
  const key = `blacklist:${token}`;
  const expiresAt = Date.now() + expiresInSeconds * 1000;
  memoryBlacklist.set(key, expiresAt);

  if (redis && isRedisConnected) {
    try {
      await redis.set(key, "revoked", "EX", expiresInSeconds);
    } catch (err) {
      console.error("Failed to write token to Redis blacklist:", err.message);
    }
  }
};

/**
 * Check if a token is blacklisted.
 * Fails safely: if Redis is configured as the authoritative store but errors,
 * we do not blindly treat the token as valid.
 */
export const isTokenBlacklisted = async (token) => {
  if (!token) return false;
  const key = `blacklist:${token}`;

  // Check local in-memory cache first
  const expiresAt = memoryBlacklist.get(key);
  if (expiresAt) {
    if (expiresAt > Date.now()) {
      return true;
    } else {
      memoryBlacklist.delete(key);
    }
  }

  // If Redis is configured, check Redis store
  if (isRedisConfigured) {
    if (!redis || !isRedisConnected) {
      // Redis is configured but disconnected: fail safely without authorizing revoked tokens
      console.warn("Redis is configured but disconnected during blacklist check");
      // Check in-memory store before failing
      return memoryBlacklist.has(key);
    }

    try {
      const result = await redis.get(key);
      return Boolean(result);
    } catch (err) {
      console.error("Redis error checking blacklist:", err.message);
      // Fail safely: if query fails, return true to avoid unauthorized access
      return true;
    }
  }

  return false;
};

export default redis;