import Attendance from "../models/Schema.Attend.js";
import Employee from "../models/Schema.Emp.js";

// ─────────────────────────────────────────────
//         helper: بداية ونهاية النهارده
// ─────────────────────────────────────────────
const getTodayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

// ─────────────────────────────────────────────
//         helper: منطق الـ checkin/checkout
//         مشترك بين الكارت والوجه والـ QR
// ─────────────────────────────────────────────
const handleAttendance = async (employeeId, method) => {
  const { start, end } = getTodayRange();

  // جيب آخر سجل النهارده بس
  const lastRecord = await Attendance.findOne({
    employee: employeeId,
    timestamp: { $gte: start, $lte: end },
  }).sort({ createdAt: -1 });

  if (!lastRecord || lastRecord.action === "checkout") {
    // لو مفيش سجل النهارده أو آخر حاجة كانت checkout → checkin جديد
    const record = await Attendance.create({
      employee: employeeId,
      action: "checkin",
      method,
      status: "success",
    });
    return { action: "checkin", record };
  }

  if (lastRecord.action === "checkin") {
    // عمل checkin قبل كده النهارده → checkout
    const record = await Attendance.create({
      employee: employeeId,
      action: "checkout",
      method,
      status: "success",
    });
    return { action: "checkout", record };
  }
};

// ─────────────────────────────────────────────
//    تسجيل الحضور بالكارت (RFID)
//    POST /api/attendance/card
//    body: { cardNumber }
// ─────────────────────────────────────────────
export const createAttendanceByCard = async (req, res) => {
  try {
    const { cardNumber } = req.body;

    if (!cardNumber) {
      return res.status(400).json({ message: "cardNumber is required" });
    }

    const employee = await Employee.findOne({ cardNumber });
    if (!employee) {
      return res.status(404).json({ status: "denied", message: "Card not recognized" });
    }

    const result = await handleAttendance(employee._id, "RFID");

    const message = result.action === "checkin" ? "Check-in recorded" : "Check-out recorded";
    return res.json({ message, data: result.record });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─────────────────────────────────────────────
//    تسجيل الحضور بالوجه (Face)
//    POST /api/attendance/face
//    body: { faceId }
// ─────────────────────────────────────────────
export const createAttendanceByFace = async (req, res) => {
  try {
    const { faceId } = req.body;

    if (!faceId) {
      return res.status(400).json({ message: "faceId is required" });
    }

    const employee = await Employee.findOne({ faceId });
    if (!employee) {
      return res.status(404).json({ status: "denied", message: "Face not recognized" });
    }

    const result = await handleAttendance(employee._id, "face");

    const message = result.action === "checkin" ? "Check-in recorded" : "Check-out recorded";
    return res.json({ message, data: result.record });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─────────────────────────────────────────────
//    تسجيل الحضور بالـ QR
//    POST /api/attendance/qr
//    body: { token }
// ─────────────────────────────────────────────
export const createAttendanceByQR = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: "QR token is required" });
    }

    // دور على الموظف صاحب الـ QR ده
    const employee = await Employee.findOne({ qr_code: token });
    if (!employee) {
      return res.status(404).json({ status: "denied", message: "Invalid QR code" });
    }

    const result = await handleAttendance(employee._id, "QR");

    const message = result.action === "checkin" ? "Check-in recorded" : "Check-out recorded";
    return res.json({ message, data: result.record });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─────────────────────────────────────────────
//    تقرير شهري  
//    GET /api/attendance/report
//    محتاج authMiddleware
// ─────────────────────────────────────────────
export const getMonthlyReport = async (req, res) => {
  try {
    const employeeId = req.user._id;

    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);

    const records = await Attendance.find({
      employee: employeeId,
      status: "success",
      timestamp: { $gte: start, $lt: end },
    }).sort({ timestamp: 1 });

    const report = {};
    let presentDays = 0;
    let lateDays = 0;

    records.forEach((record) => {
      const date = record.timestamp.toISOString().split("T")[0];

      if (!report[date]) {
        report[date] = { checkIn: null, checkOut: null, status: "Absent" };
      }

      if (record.action === "checkin") {
        report[date].checkIn = record.timestamp;
        // late لو جاء الساعة 9 أو بعدها
        report[date].status = record.timestamp.getHours() >= 9 ? "Late" : "Present";
      }

      if (record.action === "checkout") {
        report[date].checkOut = record.timestamp;
      }
    });

    Object.values(report).forEach((day) => {
      if (day.status === "Present") presentDays++;
      if (day.status === "Late") {
        presentDays++;
        lateDays++;
      }
    });

    const totalDaysInMonth = new Date(
      start.getFullYear(),
      start.getMonth() + 1,
      0
    ).getDate();

    res.json({
      summary: {
        presentDays,
        lateDays,
        absentDays: totalDaysInMonth - presentDays,
      },
      details: report,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};