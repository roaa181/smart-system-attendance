import Employee from "../models/Schema.Emp.js";

export const registerVehicle = async (req, res) => {
  try {
    const { plateNumber } = req.body;

    const employee = await Employee.findById(req.user._id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }

    if (!plateNumber) {
      return res.status(400).json({
        success: false,
        message: "plateNumber is required"
      });
    }

    const normalizedPlate = plateNumber.trim().toUpperCase();

    // ❌ لو الموظف مسجل عربية قبل كده
    if (employee.plateNumber) {
      return res.status(400).json({
        success: false,
        message: "Vehicle already registered. Use update profile to change it."
      });
    }

    // ❌ لو العربية مسجلة عند حد تاني
    const existingVehicle = await Employee.findOne({ plateNumber: normalizedPlate });
    if (existingVehicle) {
      return res.status(400).json({
        success: false,
        message: "Plate number already registered"
      });
    }

    // ✅ تسجيل العربية
    employee.plateNumber = normalizedPlate;
    await employee.save();

    res.status(201).json({
      success: true,
      message: "Vehicle registered successfully",
      data: {
        plateNumber: employee.plateNumber
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};
export default registerVehicle;
////////////////////////////////////////////////////

// import Employee from "../models/Schema.Emp.js";

// export const registerVehicle = async (req, res) => {
//   try {
//     const { employeeNumber, plateNumber } = req.body;

//     if (!employeeNumber || !plateNumber) {
//       return res.status(400).json({
//         success: false,
//         message: "employeeNumber and plateNumber are required"
//       });
//     }

//     const normalizedPlate = plateNumber.trim().toUpperCase();

//     // التأكد من أن الرقم غير مسجل لأي موظف آخر
//     const existingVehicle = await Employee.findOne({ plateNumber: normalizedPlate });
//     if (existingVehicle) {
//       return res.status(400).json({
//         success: false,
//         message: "Plate number already registered"
//       });
//     }

//     // البحث عن الموظف
//     const employee = await Employee.findOne({ employeeNumber });
//     if (!employee) {
//       return res.status(404).json({
//         success: false,
//         message: "Employee not found"
//       });
//     }

//     // تسجيل رقم العربية
//     employee.plateNumber = normalizedPlate;
//     await employee.save();

//     res.status(201).json({
//       success: true,
//       message: "Vehicle registered successfully",
//       data: {
//         employeeNumber: employee.employeeNumber,
//         plateNumber: employee.plateNumber
//       }
//     });

//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       success: false,
//       message: "Server error",
//       error: error.message
//     });
//   }
// };

// export default registerVehicle;
