const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      minlength: 6,
    },
    address: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for current balance (calculated from transactions)
customerSchema.virtual("currentBalance", {
  ref: "Transaction",
  localField: "_id",
  foreignField: "customerId",
  justOne: false,
});

module.exports = mongoose.model("Customer", customerSchema);
