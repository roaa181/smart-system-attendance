import Complaint from "../models/Complaint.js";

export const createComplaint = async (req, res) => {
  try {
    const { jobTitle, reportTitle, reportDetails } = req.body;

    const complaint = await Complaint.create({
      userId: req.user._id,        // 👈 من التوكن
      name: req.user.name,         // 👈 اسم الموظف تلقائي
      jobTitle,
      reportTitle,
      reportDetails,

    });

    res.status(201).json({
      message: "Complaint created successfully",
      complaint
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};