import express from "express";
import { userValidation } from "../services/auth.validation.js";
import { validate } from "../middleware/validate.js";
import Employee from "../models/Schema.Emp.js";
import TokenBlacklist from "../models/TokenBlacklist.js";
import jwt from "jsonwebtoken";

const router = express.Router();


// Sign Up
router.post("/signup",
  validate(userValidation.signUp),
   async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    const existingUser = await Employee.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "Email already exists" });

    const employee = await Employee.create({ name, email, password, role });
   const token = await employee.generateAuthToken();


    res.json({ message: "User created",token, emp:employee });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const employee = await Employee.findOne({ email });
    if (!employee) return res.status(400).json({ message: "Invalid email or password" });

    const isMatch = await employee.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });
    
    const token = jwt.sign(
    { id: employee._id, role: employee.role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
);
    //  const token = await employee.generateAuthToken();

    res.json({ message: "Login successful", token,employee});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});





///////////

// logout

router.post("/logout", async (req, res) => {
  const token = req.headers["authorization"]?.split(" ")[1];

  if (!token) {
    return res.status(400).json({ message: "No token provided" });
  }

  // خزّني التوكن في القائمة السوداء
  await TokenBlacklist.create({ token });

  res.json({ message: "Logged out successfully" });
});






export default router;
