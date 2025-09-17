import express from "express";
import cors from "cors";
import connectDB from "./config/database.js";
import path from "path";
import dotenv from "dotenv";
import authRouter from "./routes/auth.js";
import customersRouter from "./routes/customers.js";
import transactionsRouter from "./routes/transactions.js";

import User from "./models/User.js";
import Customer from "./models/Customer.js";
import Transaction from "./models/Transaction.js";

dotenv.config();

// Connect to database
connectDB();

const __dirname = path.resolve();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRouter);
app.use("/api/customers", customersRouter);
app.use("/api/transactions", transactionsRouter);

app.use(express.static(path.join(__dirname, "/frontend/build")));

// Basic route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "build", "index.html"));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
