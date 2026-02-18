import express from "express";
import Employee from "../models/Schema.Emp.js";
import ParkingLog from "../models/parkinglog.js";

const router = express.Router();

router.post("/enter", async (req, res) => {
  try {
    const { cardNumber } = req.body;

    if (!cardNumber) {
      return res.status(400).json({
        allowed: false,
        reason: "CARD_REQUIRED"
      });
    }

    const employee = await Employee.findOne({ cardNumber });

    if (!employee) {
      return res.status(404).json({
        allowed: false,
        reason: "INVALID_CARD"
      });
    }

    await ParkingLog.create({
      employeeId: employee._id,
      method: "rfid"
    });

    res.json({
      allowed: true,
      message: "Access granted"
    });

  } catch (error) {
    res.status(500).json({
      allowed: false,
      message: "Server error",
      error: error.message
    });
  }
});

export default router;
