const express = require("express");
const User = require("./../models/User.js");
const { generateToken } = require("./../config/jwt.js");
const { login, createAdmin } = require("./../controllers/auth.controller.js");

const router = express.Router();

//ADMIN CREATION ROUTE(DEV PURPOSE ONLY)
router.post("/createAdmin", createAdmin);

//USER LOGIN
router.post("/login", login);

module.exports = router;
