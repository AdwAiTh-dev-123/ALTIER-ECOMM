import rateLimit from "express-rate-limit";

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
