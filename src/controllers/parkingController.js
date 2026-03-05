import Employee from "../models/Schema.Emp.js";
import Vehicle from "../models/Vehicle.js";
import ParkingLog from "../models/parkinglog.js";

const CONFIDENCE_THRESHOLD = 0.8;

// ─────────────────────────────────────────
//   دخول بالكاميرا (plate recognition)
//   POST /api/parking/enter/camera
//   body: { plateNumber, confidence }
// ─────────────────────────────────────────
const enterByCamera = async (req, res) => {
  try {
    const { plateNumber, confidence } = req.body;

    if (!plateNumber || confidence === undefined) {
      return res.status(400).json({ allowed: false, message: "plateNumber and confidence are required" });
    }

    // لو الـ confidence منخفض → اطلب الكارت
    if (confidence < CONFIDENCE_THRESHOLD) {
      return res.status(403).json({
        allowed: false,
        reason: "LOW_CONFIDENCE",
        message: "Please use your RFID card",
      });
    }

    const vehicle = await Vehicle.findOne({ plateNumber });
    if (!vehicle) {
      return res.status(404).json({
        allowed: false,
        reason: "PLATE_NOT_REGISTERED",
        message: "This plate is not registered",
      });
    }

    //  FIX: شيك إن الموظف مش جوا الباركينج أصلاً
    const alreadyInside = await ParkingLog.findOne({
      employeeId: vehicle.employeeId,
      exitTime: null,
    });

    if (alreadyInside) {
      return res.status(400).json({
        allowed: false,
        reason: "ALREADY_INSIDE",
        message: "This vehicle is already inside",
      });
    }

    await ParkingLog.create({
      employeeId: vehicle.employeeId,
      plateNumber,
      method: "camera",
    });

    res.json({ allowed: true, method: "camera", message: "Gate opened" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ allowed: false, message: "Server error", error: error.message });
  }
};

// ─────────────────────────────────────────
//   دخول بالكارت RFID (override)
//   POST /api/parking/enter/rfid
//   body: { cardNumber }
// ─────────────────────────────────────────
const enterByRFID = async (req, res) => {
  try {
    const { cardNumber } = req.body;

    if (!cardNumber) {
      return res.status(400).json({ allowed: false, message: "cardNumber is required" });
    }

    const employee = await Employee.findOne({ cardNumber });
    if (!employee) {
      return res.status(404).json({ allowed: false, reason: "EMPLOYEE_NOT_FOUND" });
    }

    const vehicle = await Vehicle.findOne({ employeeId: employee._id });
    if (!vehicle) {
      return res.status(403).json({
        allowed: false,
        reason: "NO_REGISTERED_VEHICLE",
        message: "No vehicle registered for this employee",
      });
    }

    // FIX: شيك إن مفيش session مفتوحة
    const alreadyInside = await ParkingLog.findOne({
      employeeId: employee._id,
      exitTime: null,
    });

    if (alreadyInside) {
      return res.status(400).json({
        allowed: false,
        reason: "ALREADY_INSIDE",
        message: "Already inside parking",
      });
    }

    await ParkingLog.create({
      employeeId: employee._id,
      plateNumber: vehicle.plateNumber,
      method: "rfid",
    });

    res.json({ allowed: true, method: "rfid", message: "Gate opened" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ allowed: false, message: "Server error", error: error.message });
  }
};

// ─────────────────────────────────────────
//   خروج من الباركينج
//   POST /api/parking/exit
//   body: { employeeId }  أو { cardNumber }
// ─────────────────────────────────────────
const exitParking = async (req, res) => {
  try {
    const { employeeId, cardNumber } = req.body;

    let resolvedEmployeeId = employeeId;

    // لو بعتوا cardNumber بدل employeeId، نحله منه
    if (!resolvedEmployeeId && cardNumber) {
      const employee = await Employee.findOne({ cardNumber });
      if (!employee) {
        return res.status(404).json({ success: false, message: "Card not recognized" });
      }
      resolvedEmployeeId = employee._id;
    }

    if (!resolvedEmployeeId) {
      return res.status(400).json({ success: false, message: "employeeId or cardNumber is required" });
    }

    const log = await ParkingLog.findOne({
      employeeId: resolvedEmployeeId,
      exitTime: null,
    });

    if (!log) {
      return res.status(404).json({ success: false, message: "No active parking session found" });
    }

    log.exitTime = new Date();
    await log.save();

    res.json({ success: true, message: "Exit recorded, gate opened" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

export default { enterByCamera, enterByRFID, exitParking };













/////////////////////////////////////////////////////////////////////////
// import Employee from "../models/Schema.Emp.js";
// import Vehicle from "../models/Vehicle.js";
// import ParkingLog from "../models/parkinglog.js";

// const CONFIDENCE_THRESHOLD = 0.8;

// // دخول بالكاميرا
// const enterByCamera = async (req, res) => {
//   const { plateNumber, confidence } = req.body;

//   if (confidence < CONFIDENCE_THRESHOLD) {
//     return res.status(403).json({
//       allowed: false,
//       reason: "LOW_CONFIDENCE",
//       message: "Please use RFID card"
//     });
//   }

//   const vehicle = await Vehicle.findOne({ plateNumber });
//   if (!vehicle) {
//     return res.status(404).json({
//       allowed: false,
//       reason: "PLATE_NOT_REGISTERED"
//     });
//   }

//   const alreadyInside = await ParkingLog.findOne({
//     employeeId: vehicle.employeeId,
//     exitTime: null
//   });

//   if (alreadyInside) {
//     return res.status(400).json({
//       allowed: false,
//       reason: "ALREADY_INSIDE"
//     });
//   }

//   await ParkingLog.create({
//     employeeId: vehicle.employeeId,
//     vehicleId: vehicle._id,
//     plateNumber,
//     method: "camera"
//   });

//   res.json({
//     allowed: true,
//     method: "camera",
//     message: "Gate opened"
//   });
// };
// ////////////////////////////////////////////////////////////////////////////////////////
// // دخول بالكارت
// const enterByRFID = async (req, res) => {
//   try {
//     const { cardNumber } = req.body;

//     const employee = await Employee.findOne({ cardNumber });

//     if (!employee) {
//       return res.status(404).json({
//         allowed: false,
//         reason: "EMPLOYEE_NOT_FOUND"
//       });
//     }

//     const vehicle = await Vehicle.findOne({
//       employeeId: employee._id
//     });

//     if (!vehicle) {
//       return res.status(403).json({
//         allowed: false,
//         reason: "NO_REGISTERED_VEHICLE"
//       });
//     }
//      await ParkingLog.create({
//     employeeId: employee._id,
//      plateNumber: vehicle.plateNumber,  
//     method: "rfid"
//   });

//     res.json({
//       allowed: true,
//       message: "Gate opened"
//     });

//   } catch (error) {
//     res.status(500).json({
//       allowed: false,
//       message: "Server error",
//       error: error.message
//     });
//   }
// };


// ///////////////////////////////////////////////////////////////////////
// //  خروج
// const exitParking = async (req, res) => {
//   const { employeeId } = req.body;

//   const log = await ParkingLog.findOne({
//     employeeId,
//     exitTime: null
//   });

//   if (!log) {
//     return res.status(404).json({
//       success: false,
//       message: "No active parking session"
//     });
//   }

//   log.exitTime = new Date();
//   await log.save();

//   res.json({
//     success: true,
//     message: "Exit recorded, gate opened"
//   });
// };

// export default {
//   enterByCamera,
//   enterByRFID,
//   exitParking
// };