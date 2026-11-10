import rateLimit, { ipKeyGenerator } from "express-rate-limit";
// 1. General limiter for all API requests
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  limit: 200, // Max 200 requests per IP per window
  standardHeaders: "draft-8", // Returns standard `RateLimit-*` headers
  legacyHeaders: false, // Disables legacy `X-RateLimit-*` headers
  message: {
    status: 429,
    message:
      "Too many requests from this IP, please try again after 15 minutes.",
  },
});

// 2. Strict limiter for sensitive authentication & OTP endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  limit: 10, // Max 10 attempts per IP per window
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    status: 429,
    message:
      "Too many authentication attempts. Please try again after 15 minutes.",
  },
});

// 3. Dedicated per-user login rate limiter (10 attempts per 15 minutes)
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15-minute lockout window
  limit: 10, // Maximum 10 failed attempts allowed
  standardHeaders: "draft-8",
  legacyHeaders: false,

  // Track attempts per user email (fallback to IP for malformed requests)
  keyGenerator: (req) => {
    const email = req.body?.email?.trim()?.toLowerCase();
    return email ? `login:${email}` : ipKeyGenerator(req.ip);
  },

  // Only failed requests count against the 10-attempt limit
  skipSuccessfulRequests: true,

  // Triggered when the user exceeds 10 failed attempts
  handler: (req, res) => {
    const minutesLeft = req.rateLimit?.resetTime
      ? Math.ceil(
          (new Date(req.rateLimit.resetTime) - Date.now()) / (60 * 1000),
        )
      : 15;

    return res.status(429).json({
      success: false,
      message: `Too many failed login attempts. Your account has been temporarily locked to prevent unauthorized access. Please try again in ${minutesLeft} minute(s).`,
      attemptsLeft: 0,
      attemptsMade: 10,
    });
  },
});
