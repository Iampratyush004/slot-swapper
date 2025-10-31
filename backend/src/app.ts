
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { authRouter } from "./modules/auth/auth.routes";
import { eventRouter } from "./modules/events/event.routes";
import { swapRouter } from "./modules/swaps/swap.routes";
import { errorHandler } from "./middleware/errorHandler";

dotenv.config();

export const app = express();

app.use(
  cors({
    origin: ["https://slotswap.netlify.app/", "http://localhost:5173"], // adjust for your frontend URLs
    credentials: true,
  })
);

app.use(express.json());

// Health check endpoint (fixed)
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRouter);
app.use("/api/events", eventRouter);
app.use("/api", swapRouter);

app.use(errorHandler);


