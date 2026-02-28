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

export const updateProfile = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const employee = await Employee.findById(req.user._id);

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    if (name) employee.name = name;
    if (email) employee.email = email;
    if (password) employee.password = password; // هيعمل hash تلقائي

    await employee.save();

    res.json({ message: "Profile updated successfully" });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};