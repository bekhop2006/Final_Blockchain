import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import authRoutes from "./routes/auth.js";
import ordersRoutes from "./routes/orders.js";

const PORT = process.env.PORT || 3001;

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/orders", ordersRoutes);

app.get("/api/health", (_, res) => res.json({ ok: true }));

async function start() {
  try {
    const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/crypto_delivery";
    await mongoose.connect(uri);
    console.log("MongoDB connected");
  } catch (e) {
    console.error("MongoDB connection failed:", e.message);
    process.exit(1);
  }
  app.listen(PORT, () => console.log(`Backend http://localhost:${PORT}`));
}

start();
