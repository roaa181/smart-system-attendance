// routes/deviceRoutes.js
import express from "express";
import DeviceCommand from "../models/DeviceCommand.js";
import authMiddleware from "../middleware/authMiddle.js";

const router = express.Router();

// ─────────────────────────────────────────
//  الموبايل يبعت أمر
//  POST /api/device/command
//  body: { "command": "open_gate" أو "close_gate" }
//  محتاج JWT token
// ─────────────────────────────────────────
router.post("/command", authMiddleware, async (req, res) => {
  try {
    const { command } = req.body;

    if (!command) {
      return res.status(400).json({ message: "command is required" });
    }

    if (!["open_gate", "close_gate"].includes(command)) {
      return res.status(400).json({ message: "command must be open_gate or close_gate" });
    }

    const newCommand = await DeviceCommand.create({ command });
    res.json({ message: "Command sent", data: newCommand });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ─────────────────────────────────────────
//  الـ Raspberry Pi يسأل عن أوامر جديدة
//  GET /api/device/commands/pending
// ─────────────────────────────────────────
router.get("/commands/pending", async (req, res) => {
  try {
    const command = await DeviceCommand.findOne({
      status: "pending",
      createdAt: { $gte: new Date(Date.now() - 30000) } // آخر 30 ثانية بس
    }).sort({ createdAt: 1 });

    if (!command) {
      return res.json({ command: null });
    }

    res.json({ commandId: command._id, command: command.command });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ─────────────────────────────────────────
//  الـ Raspberry Pi يبعت "خلصت"
//  POST /api/device/command/done
//  body: { "commandId": "xxx" }
// ─────────────────────────────────────────
router.post("/command/done", async (req, res) => {
  try {
    const { commandId } = req.body;

    if (!commandId) {
      return res.status(400).json({ message: "commandId is required" });
    }

    await DeviceCommand.findByIdAndUpdate(commandId, { status: "done" });
    res.json({ message: "Command marked as done" });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;