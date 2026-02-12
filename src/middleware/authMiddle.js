import jwt from "jsonwebtoken";
import TokenBlacklist from "../models/TokenBlacklist.js";

const authMiddleware = async (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];

  if (!token) return res.status(401).json({ message: "No token provided" });

  const blacklisted = await TokenBlacklist.findOne({ token });
  if (blacklisted) {
    return res.status(401).json({ message: "Token has been invalidated" });
  }

  try {
    const decoded = jwt.verify(token, "secret123");
    req.user = decoded; 
    next(); 
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export default authMiddleware;
