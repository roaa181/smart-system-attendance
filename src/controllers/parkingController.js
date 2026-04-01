import Employee from "../models/Schema.Emp.js";
import Vehicle from "../models/Vehicle.js";
import ParkingLog from "../models/parkinglog.js";


const CONFIDENCE_THRESHOLD = 0.8;

// توحيد رقم العربية
const normalizePlate = (plate) => plate.toUpperCase().trim();

// ─────────────────────────────────────────
// دخول بالكاميرا (وفي نفس الوقت ممكن يعمل خروج)
// ─────────────────────────────────────────
const enterByCamera = async (req, res) => {
  try {
    let { plateNumber, confidence } = req.body;

    if (!plateNumber || typeof plateNumber !== "string" || confidence === undefined) {
      return res.status(400).json({
        success: false,
        allowed: false,
        message: "plateNumber and confidence are required",
      });
    }

    if (typeof confidence !== "number") {
      return res.status(400).json({
        success: false,
        allowed: false,
        message: "confidence must be a number",
      });
    }

    plateNumber = normalizePlate(plateNumber);

    if (confidence < CONFIDENCE_THRESHOLD) {
      return res.status(403).json({
        success: false,
        allowed: false,
        message: "Please use your RFID card",
      });
    }

    const vehicle = await Vehicle.findOne({ plateNumber });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        allowed: false,
        message: "This plate is not registered",
      });
    }

    const alreadyInside = await ParkingLog.findOne({
      employeeId: vehicle.employeeId,
      exitTime: null,
    }).sort({ entryTime: -1 });

    // ✅ لو العربية جوه → خروج
    if (alreadyInside) {
      const exitTime = new Date();

      const durationSeconds = Math.floor(
        (exitTime - alreadyInside.entryTime) / 1000
      );

      alreadyInside.exitTime = exitTime;
      await alreadyInside.save();

      return res.json({
        success: true,
        allowed: true,
        action: "exit",
        durationSeconds,
        message: "Vehicle inside → exit recorded",
      });
    }

    // ✅ دخول
    await ParkingLog.create({
      employeeId: vehicle.employeeId,
      plateNumber,
      method: "camera",
      entryTime: new Date(),
    });

    return res.json({
      success: true,
      allowed: true,
      action: "entry",
      message: "Gate opened",
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      allowed: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────
// دخول بالكارت (وفي نفس الوقت ممكن يعمل خروج)
// ─────────────────────────────────────────
const enterByRFID = async (req, res) => {
  try {
    const { cardNumber } = req.body;

    if (!cardNumber) {
      return res.status(400).json({
        success: false,
        allowed: false,
        message: "cardNumber is required",
      });
    }

    const employee = await Employee.findOne({ cardNumber });

    if (!employee) {
      return res.status(404).json({
        success: false,
        allowed: false,
        message: "Employee not found",
      });
    }

    const vehicle = await Vehicle.findOne({ employeeId: employee._id });

    if (!vehicle) {
      return res.status(403).json({
        success: false,
        allowed: false,
        message: "No vehicle registered",
      });
    }

    const alreadyInside = await ParkingLog.findOne({
      employeeId: employee._id,
      exitTime: null,
    }).sort({ entryTime: -1 });

    // ✅ لو جوه → خروج
    if (alreadyInside) {
      const exitTime = new Date();

      const durationSeconds = Math.floor(
        (exitTime - alreadyInside.entryTime) / 1000
      );

      alreadyInside.exitTime = exitTime;
      await alreadyInside.save();

      return res.json({
        success: true,
        allowed: true,
        action: "exit",
        durationSeconds,
        message: "Vehicle inside → exit recorded",
      });
    }

    // ✅ دخول
    await ParkingLog.create({
      employeeId: employee._id,
      plateNumber: normalizePlate(vehicle.plateNumber),
      method: "rfid",
      entryTime: new Date(),
    });

    return res.json({
      success: true,
      allowed: true,
      action: "entry",
      message: "Gate opened",
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      allowed: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────
// خروج صريح
// ─────────────────────────────────────────
const exitParking = async (req, res) => {
  try {
    const { employeeId, cardNumber } = req.body;

    let resolvedEmployeeId = employeeId;

    if (!resolvedEmployeeId && cardNumber) {
      const employee = await Employee.findOne({ cardNumber });

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: "Card not recognized",
        });
      }

      resolvedEmployeeId = employee._id;
    }

    if (!resolvedEmployeeId) {
      return res.status(400).json({
        success: false,
        message: "employeeId or cardNumber is required",
      });
    }

    const log = await ParkingLog.findOne({
      employeeId: resolvedEmployeeId,
      exitTime: null,
    }).sort({ entryTime: -1 });

    if (!log) {
      return res.status(404).json({
        success: false,
        message: "No active session found",
      });
    }

    const exitTime = new Date();

    const durationSeconds = Math.floor(
      (exitTime - log.entryTime) / 1000
    );

    log.exitTime = exitTime;
    await log.save();

    return res.json({
      success: true,
      allowed: true,
      action: "exit",
      message: "Exit recorded",
      data: {
        plateNumber: log.plateNumber,
        entryTime: log.entryTime,
        exitTime,
        durationSeconds,
      },
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

///////////////////////////////////////////////////////////////////
// ─────────────────────────────────────────────
//    تقرير شهري للباركينج بدون summary
//    GET /api/parking/report
//    محتاج authMiddleware
// ─────────────────────────────────────────────
export const getParkingReport = async (req, res) => {
  try {
    const employeeId = req.user._id;

    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);

    const records = await ParkingLog.find({
      employeeId,
      entryTime: { $gte: start, $lt: end },
    }).sort({ entryTime: 1 });

    const report = {};

    records.forEach((record) => {
      const date = record.entryTime.toISOString().split("T")[0];

      if (!report[date]) {
        report[date] = { sessions: [] };
      }

      const duration = record.exitTime
        ? Math.round((new Date(record.exitTime) - new Date(record.entryTime)) / 60000)
        : null;

      report[date].sessions.push({
        entryTime: record.entryTime,
        exitTime: record.exitTime || null,
        duration: duration ? `${duration} mins` : "Still inside",
        method: record.method,
        plateNumber: record.plateNumber,
      });
    });

    res.json({
      details: report,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
export default { enterByCamera, enterByRFID, exitParking ,getParkingReport};
/////////////////////////////////////////////////////////////////////////

// import Employee from "../models/Schema.Emp.js";
// import Vehicle from "../models/Vehicle.js";
// import ParkingLog from "../models/parkinglog.js";

// const CONFIDENCE_THRESHOLD = 0.8;

// // ─────────────────────────────────────────
// //   دخول بالكاميرا (plate recognition)
// //   POST /api/parking/enter/camera
// //   body: { plateNumber, confidence }
// // ─────────────────────────────────────────
// const enterByCamera = async (req, res) => {
//   try {
//     const { plateNumber, confidence } = req.body;

//     if (!plateNumber || confidence === undefined) {
//       return res.status(400).json({ allowed: false, message: "plateNumber and confidence are required" });
//     }

//     // لو الـ confidence منخفض → اطلب الكارت
//     if (confidence < CONFIDENCE_THRESHOLD) {
//       return res.status(403).json({
//         allowed: false,
//         reason: "LOW_CONFIDENCE",
//         message: "Please use your RFID card",
//       });
//     }

//     const vehicle = await Vehicle.findOne({ plateNumber });
//     if (!vehicle) {
//       return res.status(404).json({
//         allowed: false,
//         reason: "PLATE_NOT_REGISTERED",
//         message: "This plate is not registered",
//       });
//     }

//     //  FIX: شيك إن الموظف مش جوا الباركينج أصلاً
//     const alreadyInside = await ParkingLog.findOne({
//       employeeId: vehicle.employeeId,
//       exitTime: null,
//     });

//     if (alreadyInside) {
//       return res.status(400).json({
//         allowed: false,
//         reason: "ALREADY_INSIDE",
//         message: "This vehicle is already inside",
//       });
//     }

//     await ParkingLog.create({
//   employeeId: vehicle.employeeId,

//   plateNumber,
//   method: "camera",


// });
// console.log("ParkingLog created ✅"); // ← وهنا


//     res.json({ allowed: true, method: "camera", message: "Gate opened" });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ allowed: false, message: "Server error", error: error.message });
//   }
// };

// // ─────────────────────────────────────────
// //   دخول بالكارت RFID (override)
// //   POST /api/parking/enter/rfid
// //   body: { cardNumber }
// // ─────────────────────────────────────────
// const enterByRFID = async (req, res) => {
//   try {
//     const { cardNumber } = req.body;

//     if (!cardNumber) {
//       return res.status(400).json({ allowed: false, message: "cardNumber is required" });
//     }

//     const employee = await Employee.findOne({ cardNumber });
//     if (!employee) {
//       return res.status(404).json({ allowed: false, reason: "EMPLOYEE_NOT_FOUND" });
//     }

//     const vehicle = await Vehicle.findOne({ employeeId: employee._id });
//     if (!vehicle) {
//       return res.status(403).json({
//         allowed: false,
//         reason: "NO_REGISTERED_VEHICLE",
//         message: "No vehicle registered for this employee",
//       });
//     }

//     // FIX: شيك إن مفيش session مفتوحة
//     const alreadyInside = await ParkingLog.findOne({
//       employeeId: employee._id,
//       exitTime: null,
//     });

//     if (alreadyInside) {
//       return res.status(400).json({
//         allowed: false,
//         reason: "ALREADY_INSIDE",
//         message: "Already inside parking",
//       });
//     }

//     await ParkingLog.create({
//       employeeId: employee._id,
//       plateNumber: vehicle.plateNumber,
//       method: "rfid",
//     });

//     res.json({ allowed: true, method: "rfid", message: "Gate opened" });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ allowed: false, message: "Server error", error: error.message });
//   }
// };

// // ─────────────────────────────────────────
// //   خروج من الباركينج
// //   POST /api/parking/exit
// //   body: { employeeId }  أو { cardNumber }
// // ─────────────────────────────────────────
// const exitParking = async (req, res) => {
//   try {
//     const { employeeId, cardNumber } = req.body;

//     let resolvedEmployeeId = employeeId;

//     // لو بعتوا cardNumber بدل employeeId، نحله منه
//     if (!resolvedEmployeeId && cardNumber) {
//       const employee = await Employee.findOne({ cardNumber });
//       if (!employee) {
//         return res.status(404).json({ success: false, message: "Card not recognized" });
//       }
//       resolvedEmployeeId = employee._id;
//     }

//     if (!resolvedEmployeeId) {
//       return res.status(400).json({ success: false, message: "employeeId or cardNumber is required" });
//     }

//     const log = await ParkingLog.findOne({
//       employeeId: resolvedEmployeeId,
//       exitTime: null,
//     });

//     if (!log) {
//       return res.status(404).json({ success: false, message: "No active parking session found" });
//     }

//     log.exitTime = new Date();
//     await log.save();

//     res.json({ success: true, message: "Exit recorded, gate opened" });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: "Server error", error: error.message });
//   }
// };

// export default { enterByCamera, enterByRFID, exitParking };










