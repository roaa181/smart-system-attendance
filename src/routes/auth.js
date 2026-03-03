import express from "express";
import { userValidation } from "../services/auth.validation.js";
import { validate } from "../middleware/validate.js";
import Employee from "../models/Schema.Emp.js";
import TokenBlacklist from "../models/TokenBlacklist.js";
import { sendOTPEmail } from "../utils/sendEmail.js";
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

  res.json({ message: "logout successfully" });
});

//////////////////

// طلب OTP
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  const employee = await Employee.findOne({ email });
  if (!employee) {
    return res.status(404).json({ message: "Email not found" });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  employee.otp = otp;
  employee.otpExpires = Date.now() + 10 * 60 * 1000; // 10 دقائق
  await employee.save();

  await sendOTPEmail(email, otp);

  res.json({ message: "OTP sent to your email" });
});

//////////

// إعادة تعيين كلمة المرور باستخدام OTP
router.post("/reset-password", async (req, res) => {
  const { email, otp, newPassword } = req.body;

  const employee = await Employee.findOne({ email });
  if (!employee) {
    return res.status(404).json({ message: "User not found" });
  }

  if (employee.otp !== otp) {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  if (employee.otpExpires < Date.now()) {
    return res.status(400).json({ message: "OTP expired" });
  }

  employee.password = newPassword; // هيتعمل hash تلقائي
  employee.otp = null;
  employee.otpExpires = null;

  await employee.save();

  res.json({ message: "Password reset successful" });
});







export default router;
