import User from "./../models/User.js";
import { generateToken } from "./../config/jwt.js";

const createAdmin = async (req, res) => {
  try {
    const user = new User({
      username: "admin",
      password: "password123",
    });
    await user.save();
    res
      .status(201)
      .json({ success: true, message: "Admin Created successfully" });
  } catch (e) {
    console.log(e);
    res.status(500).json({ success: false, message: "Server Side error" });
  }
};

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ username });
    if (!user) {
      return res
        .status(401)
        .json({ success: "false", message: "Invalid credentials" });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: "false", message: "Invalid credentials" });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { login, createAdmin };
