// server/src/app.js
import express from "express";
import cors from "cors";
import morgan from "morgan";
import { maintenanceMode } from "./middleware/maintenanceMiddleware.js";

import authRoutes from "./routes/authRoutes.js";
import bookRoutes from "./routes/bookRoutes.js";
import memberRoutes from "./routes/memberRoutes.js";
import transactionRoutes from "./routes/transactionRoutes.js";
import reservationRoutes from "./routes/reservationRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import bookRequestRoutes from "./routes/bookRequestRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";

import { notFound, errorHandler } from "./middleware/errorMiddleware.js";

const app = express();

app.use(cors({ origin: "*", credentials: true }));
app.use(express.json());
app.use(morgan("dev"));
app.use(maintenanceMode);

app.get("/", (req, res) => {
  res.send("✅ Library Backend Running");
});

app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/members", memberRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/book-requests", bookRequestRoutes);
app.use("/api/attendance", attendanceRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
