const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500;
  const isProduction = process.env.NODE_ENV === "production";

  const message =
    statusCode === 500 && isProduction
      ? "An unexpected internal server error occurred. Please try again later."
      : err.message || "Internal Server Error";

  console.error(
    `[Error] ${req.method} ${req.originalUrl} - ${err.stack || err.message}`,
  );

  return res.status(statusCode).json({
    success: false,
    message,
    ...(req.rateLimit
      ? {
          attemptsLeft: req.rateLimit.remaining,
          attemptsMade: req.rateLimit.current,
          maxAttempts: req.rateLimit.limit,
        }
      : {}),
    ...(isProduction ? {} : { stack: err.stack }),
  });
};

export default errorHandler;
