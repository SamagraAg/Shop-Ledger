import express from "express";
import { body } from "express-validator";
import auth from "../middleware/auth.js";

import {
  createCustomer,
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
} from "../controllers/customer.controller.js";

const router = express.Router();

// ── Defining reusable validation rules for POST and PUT ─────────────────────
const customerValidation = [
  body("name").notEmpty().withMessage("Name is required").trim().escape(),
  body("phone")
    .optional({ checkFalsy: true })
    .isMobilePhone()
    .withMessage("Invalid phone"),
  body("address").optional({ checkFalsy: true }).trim().escape(),
];

// CREATE
router.post("/", auth, customerValidation, createCustomer);

// READ
router.get("/", auth, getAllCustomers);
router.get("/:id", auth, getCustomerById);

// UPDATE
router.put("/:id", auth, customerValidation, updateCustomer);

// DELETE
router.delete("/:id", auth, deleteCustomer);

export default router;
