const { validationResult } = require("express-validator");
const Transaction = require("../models/Transaction");
const Customer = require("../models/Customer");
const mongoose = require("mongoose");

// Helper: recalculate balance after every insert

const recalcBalance = async (customerId) => {
  const objectId = new mongoose.Types.ObjectId(customerId); // ← cast correctly

  const [{ balance = 0 } = {}] = await Transaction.aggregate([
    { $match: { customerId: objectId } }, // now matches documents
    {
      $group: {
        _id: "$customerId",
        balance: {
          $sum: {
            $cond: [
              { $eq: ["$type", "debt"] }, // add debts
              "$amount",
              { $multiply: ["$amount", -1] }, // subtract payments
            ],
          },
        },
      },
    },
  ]);

  return balance; // returns real total
};

// @route POST /api/transactions
exports.createTransaction = async (req, res) => {
  // ── validation ───────────────────────────────────────────────
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Invalid data",
      errors: errors.array(),
    });
  }

  const { customerId, type, amount, description, date } = req.body;

  try {
    // 1. Check customer exists
    const customer = await Customer.findById(customerId);
    if (!customer)
      return res
        .status(404)
        .json({ success: false, message: "Customer not found" });

    // 2. Save transaction
    const txn = await Transaction.create({
      customerId,
      type,
      amount,
      description,
      date,
    });

    // 3. Return transaction plus new balance
    const balance = await recalcBalance(customerId);

    res
      .status(201)
      .json({ ...txn.toObject(), currentBalance: balance, success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
