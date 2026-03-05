import express from "express";
import QRCode from "qrcode";
// import crypto from "crypto";
import Employee from "../models/Schema.Emp.js";
import authMiddleware from "../middleware/authMiddle.js";

const router = express.Router();

// ─────────────────────────────────────────
//   GET /api/qr/my-qr
//   الموظف يشوف الـ QR بتاعه
//   محتاج JWT token
// ─────────────────────────────────────────
router.get("/my-qr", authMiddleware, async (req, res) => {
  try {
    const employee = await Employee.findById(req.user._id);

    // لو مفيش QR أو انتهى → ولّد واحد جديد
    if (!employee.qr_code || !employee.qr_expires || employee.qr_expires < new Date()) {
      // employee.qr_code = employee.employeeNumber; // ← EMP0001 مثلاً
      employee.qr_code = employee.employeeNumber.slice(3); // 0028

      // بيخلص الساعة 11:59 PM النهارده
      const expires = new Date();
      expires.setHours(23, 59, 59, 999);

      employee.qr_code = token;
      employee.qr_expires = expires;
      await employee.save();
    }

    // حوّل الـ token لصورة QR
    const qrImage = await QRCode.toDataURL(employee.qr_code);

    res.json({
      token: employee.qr_code,
      qrImage,                        // base64 صورة الـ QR للـ app
      expiresAt: employee.qr_expires,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;