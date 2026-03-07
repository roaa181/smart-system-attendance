import express from "express";
import authMiddleware from "../middleware/authMiddle.js";
import adminMiddleware from "../middleware/adminmiddle.js";
import Employee from "../models/Schema.Emp.js";
import Attendance from "../models/Schema.Attend.js";
import ParkingLog from "../models/parkinglog.js";
import { sendOTPEmail } from "../utils/sendEmail.js";
import PDFDocument from "pdfkit";

const router = express.Router();

// ── كل الـ routes دي محتاجة Admin token ──
router.use(authMiddleware, adminMiddleware);

// ─────────────────────────────────────────
//   👥 EMPLOYEES MANAGEMENT
// ─────────────────────────────────────────

// جيب كل الموظفين
// GET /api/admin/employees
router.get("/employees", async (req, res) => {
  try {
    const employees = await Employee.find()
      .select("-password -tokens -otp -otpExpires")
      .sort({ createdAt: -1 });

    res.json({ total: employees.length, data: employees });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// إضافة موظف جديد
// POST /api/admin/employees
router.post("/employees", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existing = await Employee.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const employee = await Employee.create({ name, email, password, role });
    const { password: _, tokens: __, ...safe } = employee.toObject();

    res.status(201).json({ message: "Employee created", data: safe });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// تعديل موظف
// PUT /api/admin/employees/:id
router.put("/employees/:id", async (req, res) => {
  try {
    const { name, email, role, cardNumber } = req.body;

    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    if (name) employee.name = name;
    if (email) employee.email = email;
    if (role) employee.role = role;
    if (cardNumber) employee.cardNumber = cardNumber;

    await employee.save();
    res.json({ message: "Employee updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// باَن موظف (تعطيل الحساب)
// PUT /api/admin/employees/:id/ban
router.put("/employees/:id/ban", async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    employee.isBanned = true;
    await employee.save();

    res.json({ message: `${employee.name} has been banned` });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// رفع الباَن
// PUT /api/admin/employees/:id/unban
router.put("/employees/:id/unban", async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    employee.isBanned = false;
    await employee.save();

    res.json({ message: `${employee.name} has been unbanned` });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// حذف موظف
// DELETE /api/admin/employees/:id
router.delete("/employees/:id", async (req, res) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.json({ message: "Employee deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ─────────────────────────────────────────
//   📋 ATTENDANCE REPORTS
// ─────────────────────────────────────────

// حضور وغياب كل الموظفين
// GET /api/admin/attendance?from=2026-01-01&to=2026-01-31&employeeId=xxx
router.get("/attendance", async (req, res) => {
  try {
    const { from, to, employeeId } = req.query;

    const filter = {};
    if (employeeId) filter.employee = employeeId;
    if (from || to) {
      filter.timestamp = {};
      if (from) filter.timestamp.$gte = new Date(from);
      if (to) filter.timestamp.$lte = new Date(to);
    }

    const records = await Attendance.find(filter)
      .populate("employee", "name email employeeNumber department")
      .sort({ timestamp: -1 });

    res.json({ total: records.length, data: records });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// تقرير اليوم الحالي
// GET /api/admin/attendance/today
router.get("/attendance/today", async (req, res) => {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const records = await Attendance.find({
      timestamp: { $gte: start, $lte: end },
    }).populate("employee", "name email employeeNumber");

    // استخرجي الموظفين الحاضرين
    const presentIds = [...new Set(records.map((r) => r.employee?._id?.toString()))];
    const totalEmployees = await Employee.countDocuments({ isBanned: { $ne: true } });

    res.json({
      date: start.toISOString().split("T")[0],
      present: presentIds.length,
      absent: totalEmployees - presentIds.length,
      total: totalEmployees,
      records,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// export PDF تقرير حضور
// GET /api/admin/attendance/export?from=2026-01-01&to=2026-01-31
router.get("/attendance/export", async (req, res) => {
  try {
    const { from, to } = req.query;

    const filter = {};
    if (from || to) {
      filter.timestamp = {};
      if (from) filter.timestamp.$gte = new Date(from);
      if (to) filter.timestamp.$lte = new Date(to);
    }

    const records = await Attendance.find(filter)
      .populate("employee", "name employeeNumber")
      .sort({ timestamp: 1 });

    // إنشاء PDF
    const doc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=attendance_report.pdf");
    doc.pipe(res);

    doc.fontSize(18).text("Attendance Report", { align: "center" });
    doc.moveDown();

    records.forEach((r) => {
      doc.fontSize(11).text(
        `${r.employee?.name || "Unknown"} | ${r.employee?.employeeNumber} | ${r.action} | ${r.method} | ${new Date(r.timestamp).toLocaleString()}`
      );
    });

    doc.end();
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ─────────────────────────────────────────
//   📊 DASHBOARD ANALYTICS
// ─────────────────────────────────────────

// GET /api/admin/dashboard
router.get("/dashboard", async (req, res) => {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const totalEmployees = await Employee.countDocuments({ isBanned: { $ne: true } });
    const bannedEmployees = await Employee.countDocuments({ isBanned: true });

    // حاضرين النهارده
    const todayRecords = await Attendance.find({
      timestamp: { $gte: start, $lte: end },
      action: "checkin",
    }).distinct("employee");

    // إحصائيات الحضور بالـ method
    const methodStats = await Attendance.aggregate([
      { $match: { timestamp: { $gte: start, $lte: end } } },
      { $group: { _id: "$method", count: { $sum: 1 } } },
    ]);

    // الباركينج النهارده
    const activeParkingSessions = await ParkingLog.countDocuments({ exitTime: null });

    res.json({
      employees: {
        total: totalEmployees,
        banned: bannedEmployees,
        present_today: todayRecords.length,
        absent_today: totalEmployees - todayRecords.length,
      },
      attendance_methods: methodStats,
      parking: {
        active_sessions: activeParkingSessions,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ─────────────────────────────────────────
//   🔔 NOTIFICATIONS
// ─────────────────────────────────────────

// بعت notification لموظف معين
// POST /api/admin/notify/employee
router.post("/notify/employee", async (req, res) => {
  try {
    const { employeeId, subject, message } = req.body;

    if (!employeeId || !subject || !message) {
      return res.status(400).json({ message: "employeeId, subject and message are required" });
    }

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    await sendOTPEmail(employee.email, message); // بنستخدم نفس الـ sendEmail

    res.json({ message: `Notification sent to ${employee.name}` });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// بعت notification لكل الموظفين
// POST /api/admin/notify/all
router.post("/notify/all", async (req, res) => {
  try {
    const { subject, message } = req.body;

    if (!subject || !message) {
      return res.status(400).json({ message: "subject and message are required" });
    }

    const employees = await Employee.find({ isBanned: { $ne: true } }).select("email name");

    // بعت لكل الموظفين
    const results = await Promise.allSettled(
      employees.map((emp) => sendOTPEmail(emp.email, message))
    );

    const failed = results.filter((r) => r.status === "rejected").length;

    res.json({
      message: "Notifications sent",
      total: employees.length,
      failed,
      success: employees.length - failed,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ─────────────────────────────────────────
//   📡 DEVICE STATUS
// ─────────────────────────────────────────

// // GET /api/admin/devices
// router.get("/devices", async (req, res) => {
//   try {
//     const devices = await Device.find().sort({ lastSeen: -1 });
//     res.json({ total: devices.length, data: devices });
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// });

export default router;