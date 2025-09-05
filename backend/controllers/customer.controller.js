const { validationResult } = require("express-validator");
const Customer = require("../models/Customer");

// @desc    Create new customer
// @route   POST /api/customers
// @access  Private
exports.createCustomer = async (req, res) => {
  // ── validate input ────────────────────────────────────────────
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: "Invalid datza", errors: errors.array() });
  }

  const { name, phone, address } = req.body;

  try {
    const customer = await Customer.create({ name, phone, address });
    res.status(201).json(customer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

