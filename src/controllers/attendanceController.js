//                                  شروط تسجيل الحضور والانصراف بالكارت 
import Attendance from "../models/Schema.Attend.js";
import Employee from "../models/Schema.Emp.js";


export const createAttendanceByCard = async (req, res) => {
  try {
    const { cardNumber, method } = req.body;

    const employee = await Employee.findOne({ cardNumber });
    if (!employee) return res.status(404).json({ status: "denied", message: "Employee not found" });

        // آخر سجل حضور للموظف ده
     const lastRecord = await Attendance.findOne({ employee: employee._id }).sort({ createdAt: -1 });

    if (!lastRecord) {
      // أول مرة: تسجيل حضور
      const record = await Attendance.create({ employee: employee._id, action: "checkin", method, status: "success" });
      return res.json({ message: "Check-in recorded", data: record });
    } else if (lastRecord.action === "checkin") {
      // ثاني مرة: تسجيل انصراف
      const record = await Attendance.create({ employee: employee._id, action: "checkout", method, status: "success" });
      return res.json({ message: "Check-out recorded", data: record });
    } else {
      // أي مرة بعد كده
      return res.status(403).json({ message: "You have already finished your day" });
    }


  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
///////////////////////////////////////////////////////////

//                           شروط تسجيل الحضور والانصراف بالـوجه

export const createAttendanceByFace = async (req, res) => {
  try {
    const { faceId } = req.body; //, method = "face"  // ممكن تبعتها من الريكوست أو تثبتها هنا زي ما عملت
    const method = "face";

    if (!faceId) {
      return res.status(400).json({ message: "faceId is required" });
    }

    const employee = await Employee.findOne({ faceId });
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }
      const lastRecord = await Attendance.findOne({ employee: employee._id }).sort({ createdAt: -1 });

    if (!lastRecord) {
      // أول مرة: تسجيل حضور
      const record = await Attendance.create({ employee: employee._id, action: "checkin", method, status: "success" });
      return res.json({ message: "Check-in recorded", data: record });
    } else if (lastRecord.action === "checkin") {
      // ثاني مرة: تسجيل انصراف
      const record = await Attendance.create({ employee: employee._id, action: "checkout", method, status: "success" });
      return res.json({ message: "Check-out recorded", data: record });
    } else {
      // أي مرة بعد كده
      return res.status(403).json({ message: "You have already finished your day" });
    }
   

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


// ////////////////////////////////////////////////////////////////////

//                تقرير شهري عن الحضور والانصراف

export const getMonthlyReport = async (req, res) => {
  try {
    const employeeId = req.user._id;

    // نحدد الشهر الحالي
    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);

    // نجيب كل العمليات الناجحة
    const records = await Attendance.find({
      employee: employeeId,
      status: "success",
      timestamp: { $gte: start, $lt: end }
    }).sort({ timestamp: 1 });

    const report = {};
    let presentDays = 0;
    let lateDays = 0;

    records.forEach(record => {
      const date = record.timestamp.toISOString().split("T")[0];

      if (!report[date]) {
        report[date] = {
          checkIn: null,
          checkOut: null,
          status: "Absent"
        };
      }

      if (record.action === "checkin") {
        report[date].checkIn = record.timestamp;

        const hour = record.timestamp.getHours();
        if (hour >= 9) {
          report[date].status = "Late";
        } else {
          report[date].status = "Present";
        }
      }

      if (record.action === "checkout") {
        report[date].checkOut = record.timestamp;
      }
    });

    // نحسب الإحصائيات
    Object.values(report).forEach(day => {
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

    const absentDays = totalDaysInMonth - presentDays;

    res.json({
      summary: {
        presentDays,
        lateDays,
        absentDays
      },
      details: report
    });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
// //////////////////////////////////////////////////////////////////


// const Attendance = require('../models/Attendance');

// exports.getSimpleAttendance = async (req, res) => {
//   try {
//     const employeeId = req.user.id; // أو حطيه ثابت للتجربة

//     const records = await Attendance.find({ employeeId })
//       .sort({ date: -1 });

//     const formattedRecords = records.map(item => {
//       const d = new Date(item.date);

//       return {
//         day_name: d.toLocaleDateString('en-US', { weekday: 'long' }),
//         date: d.toISOString().split('T')[0],
//         check_in: item.checkIn
//           ? item.checkIn.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
//           : null,
//         check_out: item.checkOut
//           ? item.checkOut.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
//           : null,
//         status: item.status
//       };
//     });

//     res.json({
//       summary: {
//         present_days: records.filter(r => r.status === 'present').length,
//         absent_days: records.filter(r => r.status === 'absent').length
//       },
//       records: formattedRecords
//     });

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server error' });
//   }
// };
//