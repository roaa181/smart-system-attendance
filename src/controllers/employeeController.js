import Employee from "../models/Schema.Emp.js";

//////////////////////////////////////////////////////
//                GET PROFILE
//////////////////////////////////////////////////////

export const getProfile = async (req, res) => {
  try {
    const employee = await Employee.findById(req.user._id)
      .select("-password -tokens");

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.json(employee);

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

//////////////////////////////////////////////////////
//                UPDATE PROFILE
//////////////////////////////////////////////////////

// export const updateProfile = async (req, res) => {
//   try {
//     const { name, email, password, plateNumber } = req.body;

//     const employee = await Employee.findById(req.user._id);

//     if (!employee) {
//       return res.status(404).json({ message: "Employee not found" });
//     }

//     if (name) employee.name = name;
//     if (email) employee.email = email;
//     if (password) employee.password = password;
//     if (plateNumber) employee.plateNumber = plateNumber.toUpperCase().trim();

//     await employee.save();

//     res.json({ message: "Profile updated successfully" });

//   } catch (error) {
//     res.status(500).json({ message: "Server error" });
//   }
// };


export const updateProfile = async (req, res) => {
  try {
    const { name, email, password, plateNumber } = req.body;

    const employee = await Employee.findById(req.user._id);

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    if (name) employee.name = name;
    if (email) employee.email = email;
    if (password) employee.password = password;

    if (plateNumber) {
      const normalizedPlate = plateNumber.trim().toUpperCase();

      // تحقق من صحة رقم العربية
      const plateRegex = /^[A-Z0-9]{4,8}$/;
      if (!plateRegex.test(normalizedPlate)) {
        return res.status(400).json({ message: "Invalid plate number format" });
      }

      // تحقق من عدم وجود الرقم عند موظف آخر
      const existingVehicle = await Employee.findOne({ plateNumber: normalizedPlate });
      if (existingVehicle && existingVehicle._id.toString() !== employee._id.toString()) {
        return res.status(400).json({ message: "Plate number already registered to another employee" });
      }

      employee.plateNumber = normalizedPlate;
    }

    await employee.save();

    res.json({
      message: "Profile updated successfully",
      data: {
        name: employee.name,
        email: employee.email,
        plateNumber: employee.plateNumber
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export default updateProfile;