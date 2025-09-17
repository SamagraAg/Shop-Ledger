import express from "express";
import User from "./../models/User.js";
import { generateToken } from "./../config/jwt.js";
import { login, createAdmin } from "./../controllers/auth.controller.js";

const router = express.Router();

//ADMIN CREATION ROUTE(DEV PURPOSE ONLY)
router.post("/createAdmin", createAdmin);

//USER LOGIN
router.post("/login", login);

export default router;
