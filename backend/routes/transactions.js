import express from "express";
import { body } from "express-validator";
import auth from "../middleware/auth.js";
import {
  createTransaction,
  getTransactionsByCustomer,
  updateTransaction,
  deleteTransaction,
} from "../controllers/transaction.controller.js";

const router = express.Router();

// Validation rules reused on POST
const txnValidation = [
  body("customerId").isMongoId().withMessage("Valid customerId required"),
  body("type")
    .isIn(["debt", "payment"])
    .withMessage("Type must be debt or payment"),
  body("amount").isFloat({ gt: 0 }).withMessage("Amount must be > 0"),
  body("description").optional({ checkFalsy: true }).trim().escape(),
  body("date").optional({ checkFalsy: true }).isISO8601().toDate(),
];

// CREATE (append-only)
router.post("/", auth, txnValidation, createTransaction);

// READ by customer
router.get("/customer/:id", auth, getTransactionsByCustomer);

// DELETE
router.delete("/:id", auth, deleteTransaction);

// UPDATE (full replace)
router.put(
  "/:id",
  auth,
  [
    body("type").isIn(["debt", "payment"]).withMessage("Type must be debt or payment"),
    body("amount").isFloat({ gt: 0 }).withMessage("Amount must be > 0"),
    body("description").optional({ checkFalsy: true }).trim().escape(),
    body("date").optional({ checkFalsy: true }).isISO8601().toDate()
  ],
  updateTransaction
);

export default router;
