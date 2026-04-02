
// import Vehicle from "../models/Vehicle.js";
import Employee from "../models/Schema.Emp.js";

export const registerVehicle = async (req, res) => {
  try {
    const { employeeNumber, plateNumber } = req.body;

    if (!employeeNumber || !plateNumber) {
      return res.status(400).json({
        success: false,
        message: "employeeNumber and plateNumber are required"
      });
    }

    // دور على الموظف بالـ employeeNumber
    const employee = await Employee.findOne({ employeeNumber });
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }

    // التأكد إن العربية مش مسجلة قبل كده
    const existingVehicle = await Vehicle.findOne({ plateNumber });
    if (existingVehicle) {
      return res.status(400).json({
        success: false,
        message: "Plate number already registered"
      });
    }

    const vehicle = await Vehicle.create({
      plateNumber,
      employeeId: employee._id
    });

    res.status(201).json({
      success: true,
      message: "Vehicle registered successfully",
      data: vehicle
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

export default registerVehicle;
