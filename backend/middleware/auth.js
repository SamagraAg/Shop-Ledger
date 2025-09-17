import { verifyToken } from "../config/jwt";
import User from "../models/User";

const auth = async (req, res, next) => {
  try {
    //Grab the token from the header
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "No token provided" });
    }

    //Verifying the token validity
    const decoded = verifyToken(token);

    //Fetching the user that the token refers to
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }

    //Attaching user details to request and continue
    req.user = user;
    next();
  } catch (err) {
    console.error(err.message);
    res
      .status(401)
      .json({ success: false, message: "Token verification failed" });
  }
};

export default auth;
