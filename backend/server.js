import express from "express";
import cors from "cors";
import connectDB from "./config/database.js";
import path from "path";
import dotenv from "dotenv";

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
app.use("/api/auth", require("./routes/auth.js"));
app.use("/api/customers", require("./routes/customers.js"));
app.use("/api/transactions", require("./routes/transactions.js"));

app.use(express.static(path.join(__dirname, "/client/build")));

// Basic route
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "client", "build", "index.html"));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
