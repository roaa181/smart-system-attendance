import Employee from "../models/Schema.Emp.js";

export const assignFaceByEmployeeNumber = async (req, res) => {
  try {
    const { employeeNumber, faceId } = req.body;

    console.log("BODY =", req.body);
    console.log("employeeNumber =", employeeNumber);

    if (!employeeNumber || !faceId) {
      return res.status(400).json({
        success: false,
        message: "employeeNumber and faceId are required"
      });
    }

    const employee = await Employee.findOne({
      employeeNumber: employeeNumber.trim()
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
        employeeNumber
      });
    }

    employee.faceId = JSON.stringify(faceId);

    await employee.save();

    return res.status(200).json({
      success: true,
      message: "Face registered successfully",
      employeeNumber: employee.employeeNumber,
      name: employee.name
    });

  } catch (error) {
    console.error("FACE REGISTER ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

