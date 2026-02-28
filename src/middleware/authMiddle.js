import jwt from "jsonwebtoken";
import Employee from "../models/Schema.Emp.js";
import TokenBlacklist from "../models/TokenBlacklist.js";

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];//TTL اختصار ل time to live يعني مدة صلاحية التوكن

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    //  Check blacklist
    const blacklisted = await TokenBlacklist.findOne({ token });
    if (blacklisted) {
      return res.status(401).json({ message: "Token has been invalidated" });
    }
    console.log("AUTH HEADER:", req.headers.authorization);
     console.log("TOKEN AFTER SPLIT:", token);

    //  Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    //  Get employee from DB
    const employee = await Employee.findById(decoded.id);
    if (!employee) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    //  Attach full employee object
    req.user = employee;

    next();
  } catch (error) {
  console.log("JWT ERROR:", error.message);
  return res.status(401).json({ message: error.message });
}
};


export default authMiddleware;
