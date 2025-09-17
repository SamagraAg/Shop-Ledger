const express = require("express");
const cors = require("cors");
const connectDB = require("./config/database");
const path = require("path");
require("dotenv").config();

const User = require("./models/User.js");
const Customer = require("./models/Customer.js");
const Transaction = require("./models/Transaction.js");

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
