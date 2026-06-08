import express from "express";
import authMiddleware from "../middleware/authMiddle.js";
import adminMiddleware from "../middleware/adminmiddle.js";
import Employee from "../models/Schema.Emp.js";
import Attendance from "../models/Schema.Attend.js";
import ParkingLog from "../models/parkinglog.js";
import Complaint from "../models/Complaint.js";
import DeviceStatus from "../models/DeviceStatus.js";
import DeviceCommand from "../models/DeviceCommand.js";
import TokenBlacklist from "../models/TokenBlacklist.js";
import { sendNotificationEmail } from "../utils/sendEmail.js";
import PDFDocument from "pdfkit";

const router = express.Router();

// كل الـ routes محتاجة Admin token
router.use(authMiddleware, adminMiddleware);

// ═══════════════════════════════════════════════════════
//   EMPLOYEES MANAGEMENT 
// ═══════════════════════════════════════════════════════

// GET /api/admin/employees
router.get("/employees", async (req, res) => {
  try {
    const { search, role, isBanned } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (isBanned !== undefined) filter.isBanned = isBanned === "true";
    if (search) filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { employeeNumber: { $regex: search, $options: "i" } },
    ];

    const employees = await Employee.find(filter)
      .select("-password -tokens -otp -otpExpires")
      .sort({ createdAt: -1 });

    res.json({ total: employees.length, data: employees });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// POST /api/admin/employees
router.post("/employees", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const existing = await Employee.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email already exists" });

    const employee = await Employee.create({ name, email, password, role });
    const { password: _, tokens: __, ...safe } = employee.toObject();
    res.status(201).json({ message: "Employee created", data: safe });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// PUT /api/admin/employees/:id
router.put("/employees/:id", async (req, res) => {
  try {
    const { name, email, role, cardNumber, plateNumber } = req.body;
    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).json({ message: "Employee not found" });

    if (name) employee.name = name;
    if (email) employee.email = email;
    if (role) employee.role = role;
    if (cardNumber) employee.cardNumber = cardNumber;
    if (plateNumber) employee.plateNumber = plateNumber.toUpperCase().trim();

    await employee.save();
    res.json({ message: "Employee updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// PUT /api/admin/employees/:id/ban
router.put("/employees/:id/ban", async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).json({ message: "Employee not found" });
    employee.isBanned = true;
    await employee.save();
    res.json({ message: `${employee.name} has been banned` });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// PUT /api/admin/employees/:id/unban
router.put("/employees/:id/unban", async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).json({ message: "Employee not found" });
    employee.isBanned = false;
    await employee.save();
    res.json({ message: `${employee.name} has been unbanned` });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// DELETE /api/admin/employees/:id
router.delete("/employees/:id", async (req, res) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee) return res.status(404).json({ message: "Employee not found" });
    res.json({ message: "Employee deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// GET /api/admin/employees/:id
router.get("/employees/:id", async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .select("-password -tokens -otp -otpExpires");

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.json(employee);
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});

// DELETE /api/admin/employees/:id/card
router.delete("/employees/:id/card", async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    employee.cardNumber = null;
    await employee.save();

    res.json({
      message: "Card removed successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});

// DELETE /api/admin/employees/:id/face
router.delete("/employees/:id/face", async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    employee.faceId = null;
    await employee.save();

    res.json({
      message: "Face removed successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});

// GET /api/admin/employees/:id/attendance
router.get("/employees/:id/attendance", async (req, res) => {
  try {
    const { from, to } = req.query;

    const filter = {
      employee: req.params.id,
    };

    if (from || to) {
      filter.timestamp = {};

      if (from) {
        filter.timestamp.$gte = new Date(from);
      }

      if (to) {
        filter.timestamp.$lte = new Date(to);
      }
    }

    const attendance = await Attendance.find(filter)
      .sort({ timestamp: -1 });

    res.json({
      total: attendance.length,
      data: attendance,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});
// ═══════════════════════════════════════════════════════
//   VEHICLES MANAGEMENT (admin)
//   /api/admin/vehicles
// ═══════════════════════════════════════════════════════

// GET /api/admin/vehicles — كل العربيات مع بيانات الموظفين
router.get("/vehicles", async (req, res) => {
  try {
    const { search } = req.query;
    const filter = { plateNumber: { $ne: null } };
    if (search) filter.plateNumber = { $regex: search, $options: "i" };

    const employees = await Employee.find(filter)
      .select("name email employeeNumber plateNumber")
      .sort({ createdAt: -1 });

    res.json({ total: employees.length, data: employees });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// PUT /api/admin/vehicles/:employeeId — تعديل رقم العربية
router.put("/vehicles/:employeeId", async (req, res) => {
  try {
    const { plateNumber } = req.body;
    if (!plateNumber) return res.status(400).json({ message: "plateNumber is required" });

    const employee = await Employee.findById(req.params.employeeId);
    if (!employee) return res.status(404).json({ message: "Employee not found" });

    // تأكد مش مسجلة لحد تاني
    const existing = await Employee.findOne({
      plateNumber: plateNumber.toUpperCase().trim(),
      _id: { $ne: employee._id }
    });
    if (existing) return res.status(400).json({ message: "Plate number already registered" });

    employee.plateNumber = plateNumber.toUpperCase().trim();
    await employee.save();
    res.json({ message: "Vehicle updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// DELETE /api/admin/vehicles/:employeeId — مسح رقم العربية
router.delete("/vehicles/:employeeId", async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.employeeId);
    if (!employee) return res.status(404).json({ message: "Employee not found" });
    employee.plateNumber = null;
    await employee.save();
    res.json({ message: "Vehicle removed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ═══════════════════════════════════════════════════════
//   COMPLAINTS MANAGEMENT (admin)
//   /api/admin/complaints
// ═══════════════════════════════════════════════════════

// GET /api/admin/complaints?status=pending&page=1&limit=10
router.get("/complaints", async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const total = await Complaint.countDocuments(filter);
    const complaints = await Complaint.find(filter)
      .populate("userId", "name email employeeNumber")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ total, page: Number(page), data: complaints });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// PUT /api/admin/complaints/:id — رد الأدمن + تغيير الحالة
router.put("/complaints/:id", async (req, res) => {
  try {
    const { reply, status } = req.body;
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: "Complaint not found" });

    if (reply) complaint.reply = reply;
    if (status) complaint.status = status;
    await complaint.save();

    res.json({ message: "Complaint updated", data: complaint });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// DELETE /api/admin/complaints/:id
router.delete("/complaints/:id", async (req, res) => {
  try {
    const complaint = await Complaint.findByIdAndDelete(req.params.id);
    if (!complaint) return res.status(404).json({ message: "Complaint not found" });
    res.json({ message: "Complaint deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ═══════════════════════════════════════════════════════
//   ATTENDANCE REPORTS
// ═══════════════════════════════════════════════════════
 // POST /api/admin/attendance
router.post("/attendance", async (req, res) => {
  try {
    const { records } = req.body;

    if (!Array.isArray(records)) {
      return res.status(400).json({
        message: "records must be array",
      });
    }

    const inserted = await Attendance.insertMany(records);

    res.status(201).json({
      message: "Attendance saved successfully",
      count: inserted.length,
      data: inserted,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});

// GET /api/admin/attendance?date=&from=&to=&employeeId=
router.get("/attendance", async (req, res) => {
  try {
    const {
      date,
      from,
      to,
      employeeId,
    } = req.query;

    const filter = {};

    if (employeeId) {
      filter.employee = employeeId;
    }

    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);

      const end = new Date(date);
      end.setHours(23, 59, 59, 999);

      filter.timestamp = {
        $gte: start,
        $lte: end,
      };
    }

    if (from || to) {
      filter.timestamp = {};

      if (from) {
        filter.timestamp.$gte = new Date(from);
      }

      if (to) {
        filter.timestamp.$lte = new Date(to);
      }
    }

    const records = await Attendance.find(filter)
      .populate(
        "employee",
        "name email employeeNumber"
      )
      .sort({ timestamp: -1 });

    res.json({
      total: records.length,
      data: records,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});
// GET /api/admin/attendance/history
router.get("/attendance/history", async (req, res) => {
  try {
    const {
      employeeId,
      status,
      fromDate,
      toDate,
      query,
    } = req.query;

    const filter = {};

    if (employeeId) {
      filter.employee = employeeId;
    }

    if (status) {
      filter.status = status;
    }

    if (fromDate || toDate) {
      filter.timestamp = {};

      if (fromDate) {
        filter.timestamp.$gte = new Date(fromDate);
      }

      if (toDate) {
        filter.timestamp.$lte = new Date(toDate);
      }
    }

    let records = await Attendance.find(filter)
      .populate(
        "employee",
        "name email employeeNumber"
      )
      .sort({ timestamp: -1 });

    if (query) {
      const q = query.toLowerCase();

      records = records.filter((record) => {
        const emp = record.employee || {};

        return (
          emp.name?.toLowerCase().includes(q) ||
          emp.email?.toLowerCase().includes(q) ||
          emp.employeeNumber?.toLowerCase().includes(q)
        );
      });
    }

    res.json({
      total: records.length,
      data: records,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});

// GET /api/admin/attendance/today
router.get("/attendance/today", async (req, res) => {
  try {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end = new Date();   end.setHours(23, 59, 59, 999);

    const records = await Attendance.find({ timestamp: { $gte: start, $lte: end } })
      .populate("employee", "name email employeeNumber");

    const presentIds = [...new Set(records.map(r => r.employee?._id?.toString()))];
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

// GET /api/admin/attendance/export?from=&to=&format=pdf
router.get("/attendance/export", async (req, res) => {
  try {
    const { from, to } = req.query;
    const filter = {};
    if (from || to) {
      filter.timestamp = {};
      if (from) filter.timestamp.$gte = new Date(from);
      if (to)   filter.timestamp.$lte = new Date(to);
    }

    const records = await Attendance.find(filter)
      .populate("employee", "name employeeNumber")
      .sort({ timestamp: 1 });

    const doc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=attendance_report.pdf");
    doc.pipe(res);

    doc.fontSize(18).text("Attendance Report", { align: "center" });
    doc.moveDown();
    records.forEach(r => {
      doc.fontSize(11).text(
        `${r.employee?.name || "Unknown"} | ${r.employee?.employeeNumber} | ${r.action} | ${r.method} | ${new Date(r.timestamp).toLocaleString()}`
      );
    });
    doc.end();
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ═══════════════════════════════════════════════════════
//   DASHBOARD ANALYTICS
// ═══════════════════════════════════════════════════════

// GET /api/admin/dashboard
router.get("/dashboard", async (req, res) => {
  try {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end   = new Date(); end.setHours(23, 59, 59, 999);

    const totalEmployees    = await Employee.countDocuments({ isBanned: { $ne: true } });
    const bannedEmployees   = await Employee.countDocuments({ isBanned: true });
    const totalVehicles     = await Employee.countDocuments({ plateNumber: { $ne: null } });
    const pendingComplaints = await Complaint.countDocuments({ status: "pending" });

    const todayRecords = await Attendance.find({
      timestamp: { $gte: start, $lte: end },
      action: "checkin",
    }).distinct("employee");

    const methodStats = await Attendance.aggregate([
      { $match: { timestamp: { $gte: start, $lte: end } } },
      { $group: { _id: "$method", count: { $sum: 1 } } },
    ]);

    const activeParkingSessions = await ParkingLog.countDocuments({ exitTime: null });

    res.json({
      employees: {
        total: totalEmployees,
        banned: bannedEmployees,
        present_today: todayRecords.length,
        absent_today: totalEmployees - todayRecords.length,
      },
      vehicles: { total: totalVehicles },
      complaints: { pending: pendingComplaints },
      attendance_methods: methodStats,
      parking: { active_sessions: activeParkingSessions },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ═══════════════════════════════════════════════════════
//   GATES / DEVICES
//   /api/admin/gates
// ═══════════════════════════════════════════════════════

// GET /api/admin/gates — حالة الأجهزة
router.get("/gates", async (req, res) => {
  try {
    const gate   = await DeviceStatus.findOne({ device: "gate" });
    const camera = await DeviceStatus.findOne({ device: "camera" });

    res.json({
      gate:   { status: gate?.status   || "unknown", updatedAt: gate?.updatedAt   || null },
      camera: { status: camera?.status || "unknown", updatedAt: camera?.updatedAt || null },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// POST /api/admin/gates/command — إرسال أمر للبوابة
router.post("/gates/command", async (req, res) => {
  try {
    const { command } = req.body;
    if (!["open_gate", "close_gate", "open_camera", "close_camera"].includes(command)) {
      return res.status(400).json({ message: "Invalid command" });
    }

    const newCommand = await DeviceCommand.create({ command });

    const device = command.includes("gate") ? "gate" : "camera";
    const status = command.startsWith("open") ? "open" : "closed";
    await DeviceStatus.findOneAndUpdate(
      { device },
      { status, updatedAt: new Date() },
      { upsert: true, new: true }
    );

    res.json({ message: "Command sent", data: newCommand });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ═══════════════════════════════════════════════════════
//   EVENT LOGS / AUDIT
//   /api/admin/audit
// ═══════════════════════════════════════════════════════

// GET /api/admin/audit?type=attendance|parking|complaints&page=1&limit=20
router.get("/audit", async (req, res) => {
  try {
    const { type = "attendance", page = 1, limit = 20, from, to } = req.query;

    const filter = {};
    if (from || to) {
      const dateField = type === "parking" ? "entryTime" : "timestamp";
      filter[dateField] = {};
      if (from) filter[dateField].$gte = new Date(from);
      if (to)   filter[dateField].$lte = new Date(to);
    }

    let logs = [];
    let total = 0;

    if (type === "attendance") {
      total = await Attendance.countDocuments(filter);
      logs  = await Attendance.find(filter)
        .populate("employee", "name employeeNumber")
        .sort({ timestamp: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit));
    } else if (type === "parking") {
      total = await ParkingLog.countDocuments(filter);
      logs  = await ParkingLog.find(filter)
        .populate("employeeId", "name employeeNumber")
        .sort({ entryTime: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit));
    } else if (type === "complaints") {
      total = await Complaint.countDocuments(filter);
      logs  = await Complaint.find(filter)
        .populate("userId", "name employeeNumber")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit));
    }

    res.json({ total, page: Number(page), data: logs });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// DELETE /api/admin/audit?type=attendance — مسح الـ logs
router.delete("/audit", async (req, res) => {
  try {
    const { type } = req.query;
    if (type === "attendance") {
      await Attendance.deleteMany({});
    } else if (type === "parking") {
      await ParkingLog.deleteMany({});
    } else {
      return res.status(400).json({ message: "type required: attendance or parking" });
    }
    res.json({ message: `${type} logs cleared successfully` });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ═══════════════════════════════════════════════════════
//   AUTH SESSIONS
//   /api/admin/sessions
// ═══════════════════════════════════════════════════════

// GET /api/admin/sessions — كل الـ sessions النشطة
router.get("/sessions", async (req, res) => {
  try {
    const employees = await Employee.find({ "tokens.0": { $exists: true } })
      .select("name email employeeNumber tokens createdAt");

    const sessions = employees.map(emp => ({
      employeeId: emp._id,
      name: emp.name,
      email: emp.email,
      employeeNumber: emp.employeeNumber,
      activeSessions: emp.tokens.length,
    }));

    res.json({ total: sessions.length, data: sessions });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// DELETE /api/admin/sessions/:employeeId — logout موظف معين
router.delete("/sessions/:employeeId", async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.employeeId);
    if (!employee) return res.status(404).json({ message: "Employee not found" });

    // blacklist كل التوكنز
    await Promise.all(employee.tokens.map(t => TokenBlacklist.create({ token: t.token })));
    employee.tokens = [];
    await employee.save();

    res.json({ message: `${employee.name} logged out successfully` });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// POST /api/admin/sessions/logout-all — logout كل الموظفين
router.post("/sessions/logout-all", async (req, res) => {
  try {
    const employees = await Employee.find({ "tokens.0": { $exists: true } });

    for (const emp of employees) {
      await Promise.all(emp.tokens.map(t => TokenBlacklist.create({ token: t.token })));
      emp.tokens = [];
      await emp.save();
    }

    res.json({ message: "All sessions terminated", count: employees.length });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ═══════════════════════════════════════════════════════
//   SYSTEM (backup, security scan, maintenance)
//   /api/admin/system
// ═══════════════════════════════════════════════════════

// GET /api/admin/system/status
router.get("/system/status", async (req, res) => {
  try {
    const totalEmployees    = await Employee.countDocuments();
    const totalAttendance   = await Attendance.countDocuments();
    const totalParking      = await ParkingLog.countDocuments();
    const totalComplaints   = await Complaint.countDocuments();
    const blacklistedTokens = await TokenBlacklist.countDocuments();

    res.json({
      status: "online",
      database: "connected",
      collections: {
        employees:  totalEmployees,
        attendance: totalAttendance,
        parking:    totalParking,
        complaints: totalComplaints,
        blacklistedTokens,
      },
      timestamp: new Date(),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// POST /api/admin/system/backup — snapshot للإحصائيات
router.post("/system/backup", async (req, res) => {
  try {
    const employees  = await Employee.countDocuments();
    const attendance = await Attendance.countDocuments();
    const parking    = await ParkingLog.countDocuments();

    res.json({
      message: "Backup snapshot created",
      snapshot: { employees, attendance, parking, createdAt: new Date() },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// POST /api/admin/system/security-scan
router.post("/system/security-scan", async (req, res) => {
  try {
    const blacklistedCount = await TokenBlacklist.countDocuments();
    const bannedEmployees  = await Employee.countDocuments({ isBanned: true });
    const activeTokens     = await Employee.aggregate([
      { $project: { count: { $size: "$tokens" } } },
      { $group: { _id: null, total: { $sum: "$count" } } },
    ]);

    res.json({
      message: "Security scan completed",
      results: {
        blacklistedTokens: blacklistedCount,
        bannedEmployees,
        activeTokens: activeTokens[0]?.total || 0,
        scanTime: new Date(),
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ═══════════════════════════════════════════════════════
//   NOTIFICATIONS
// ═══════════════════════════════════════════════════════

// POST /api/admin/notify/employee
router.post("/notify/employee", async (req, res) => {
  try {
    const { employeeId, subject, message } = req.body;
    if (!employeeId || !subject || !message) {
      return res.status(400).json({ message: "employeeId, subject and message are required" });
    }

    const employee = await Employee.findById(employeeId);
    if (!employee) return res.status(404).json({ message: "Employee not found" });

    await sendNotificationEmail(employee.email, subject, message);
    res.json({ message: `Notification sent to ${employee.name}` });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// POST /api/admin/notify/all
router.post("/notify/all", async (req, res) => {
  try {
    const { subject, message } = req.body;
    if (!subject || !message) {
      return res.status(400).json({ message: "subject and message are required" });
    }

    const employees = await Employee.find({ isBanned: { $ne: true } }).select("email name");
    const results   = await Promise.allSettled(
      employees.map(emp => sendNotificationEmail(emp.email, subject, message))
    );

    const failed = results.filter(r => r.status === "rejected").length;
    res.json({ message: "Notifications sent", total: employees.length, failed, success: employees.length - failed });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;