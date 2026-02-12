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

    // const lastRecord = await Attendance.findOne({ employee: employee._id }).sort({ timestamp: -1}); //ترتيب تنازلي 
    // let action = "checkin";
    // if (lastRecord && lastRecord.action === "checkin") action = "checkout";

    // const record = await Attendance.create({ employee: employee._id, action, method, status: "success" });

    // res.json({ message: "Attendance recorded", data: record });

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