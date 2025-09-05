const { validationResult } = require("express-validator");
const Customer = require("../models/Customer");

// @desc    Create new customer
// @route   POST /api/customers
// @access  Private
exports.createCustomer = async (req, res) => {
  // ── validate input ────────────────────────────────────────────
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Invalid data",
      errors: errors.array(),
    });
  }

  const { name, phone, address } = req.body;

  try {
    const customer = await Customer.create({ name, phone, address });
    res.status(201).json({ success: true, customer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Get all customers
// @route   GET /api/customers
// @access  Private
exports.getAllCustomers = async (req, res) => {
  try {
    //case insensitive alphabetical sorting by name
    const customers = await Customer.find()
      .collation({ locale: "en" })
      .sort({ name: 1 });
    // const customers = await Customer.find().sort({ createdAt: -1 });
    res.json({ success: true, customers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Get one customer by ID
// @route   GET /api/customers/:id
// @access  Private
exports.getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer)
      return res
        .status(404)
        .json({ success: false, message: "Customer not found" });
    res.json({ success: true, customer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
