import mongoose from "mongoose";

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

// Fetches all customer transactions when populated
customerSchema.virtual("transactions", {
  ref: "Transaction",
  localField: "_id",
  foreignField: "customerId",
  justOne: false,
});

export default mongoose.model("Customer", customerSchema);
