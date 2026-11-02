import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import shopRoutes from "./routes/shopRoutes.js";
import errorHandler from "./middlewares/errorHandler.js";

const app = express();

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api", shopRoutes);

app.use((req, res, next) => {
    const error = new Error(`Resource not found on this server: ${req.method} ${req.originalUrl}`);
    error.statusCode = 404;
    next(error);
});


app.use(errorHandler);

export default app;
