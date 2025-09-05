const express = require("express");
const cors = require("cors");
const connectDB = require("./config/database");
require("dotenv").config();

const User = require("./models/User.js");
const Customer = require("./models/Customer.js");
const Transaction = require("./models/Transaction.js");

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth.js'));
app.use('/api/customers', require('./routes/customers'));
// app.use('/api/transactions', require('./routes/transactions'));

// Basic route
app.get("/", (req, res) => {
  res.json({ message: "Shop Ledger API is running!" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
