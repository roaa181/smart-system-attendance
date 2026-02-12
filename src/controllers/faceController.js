
                                      // faceId//
import Employee from "../models/Schema.Emp.js";
                              
export const assignFaceByEmployeeNumber  = async (req, res) => {
  try {
    const { employeeNumber, faceId } = req.body;

    if (!employeeNumber || !faceId) {
      return res.status(400).json({ message: "employeeNumber and faceId are required" });
    }

    // تأكدي إن الـ faceId مش مستخدم قبل كده
    const existingFace = await Employee.findOne({ faceId });
    if (existingFace) {
      return res.status(400).json({ message: "This Face ID is already assigned to another employee" });
    }

    // البحث عن الموظف
    const employee = await Employee.findOne({ employeeNumber });
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    employee.faceId = faceId;
    await employee.save();

    res.json({
      message: "Face ID assigned successfully",
      employeeNumber: employee.employeeNumber,
      name: employee.name,
      faceId: employee.faceId
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

