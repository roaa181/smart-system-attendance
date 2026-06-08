import express from "express";
import authMiddleware from "../middleware/authMiddle.js";
import { createComplaint } from "../controllers/complaint.controller.js";
import Complaint from "../models/Complaint.js";
import adminMiddleware from "../middleware/adminmiddle.js"

const router = express.Router();

//  الموظف يبعت شكوى فقط
router.post("/", authMiddleware, createComplaint);

router.get("/my", authMiddleware, async (req, res) => {
  try {
    const complaints = await Complaint.find({
      userId: req.user._id
    });

    res.json({
      count: complaints.length,
      data: complaints
    });

  } catch (err) {
    res.status(500).json({
      message: "Error fetching complaints",
      error: err.message
    });
  }
});



export default router;