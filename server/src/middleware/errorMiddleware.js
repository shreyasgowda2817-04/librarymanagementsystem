// server/src/middleware/errorMiddleware.js
export const notFound = (req, res, next) => {
  res.status(404);
  next(new Error(`Not Found - ${req.originalUrl}`));
};

export const errorHandler = (err, req, res, next) => {
  console.error("🔥 GLOBAL ERROR HANDLER CAUGHT AN ERROR:", err);
  const code = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(code).json({
    message: err.message || "Server error",
    stack: err.stack
  });
};
