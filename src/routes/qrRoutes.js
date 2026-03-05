import express from "express";
import QRCode from "qrcode";
import Employee from "../models/Schema.Emp.js";
import authMiddleware from "../middleware/authMiddle.js";

const router = express.Router();

router.get("/my-qr", authMiddleware, async (req, res) => {
  try {
    const employee = await Employee.findById(req.user._id);

    if (!employee.qr_code || !employee.qr_expires || employee.qr_expires < new Date()) {
      const expires = new Date();
      expires.setHours(23, 59, 59, 999);

      employee.qr_code = employee.employeeNumber.slice(3); // 0028
      employee.qr_expires = expires;
      await employee.save();
    }

    const qrImage = await QRCode.toDataURL(employee.qr_code);

    res.json({
      qr_code: employee.qr_code,
      qrImage,
      expiresAt: employee.qr_expires,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;