// // routes/deviceRoutes.js
// import express from "express";
// import DeviceCommand from "../models/DeviceCommand.js";
// import DeviceStatus from "../models/DeviceStatus.js";
// import authMiddleware from "../middleware/authMiddle.js";

// const router = express.Router();

// // ─────────────────────────────────────────
// //  الموبايل يبعت أمر
// //  POST /api/device/command
// //  body: { "command": "open_gate" أو "close_gate" أو "open_camera" أو "close_camera" }
// //  محتاج JWT token
// // ─────────────────────────────────────────
// router.post("/command", authMiddleware, async (req, res) => {
//   try {
//     const { command } = req.body;

//     if (!command) {
//       return res.status(400).json({ message: "command is required" });
//     }

//     if (!["open_gate", "close_gate", "open_camera", "close_camera"].includes(command)) {
//       return res.status(400).json({ message: "command must be open_gate, close_gate, open_camera, or close_camera" });
//     }

//     // حفظ الأمر
//     const newCommand = await DeviceCommand.create({ command });

//     // تحديث الـ status تلقائياً
//     const device = command.includes("gate") ? "gate" : "camera";
//     const status = command.startsWith("open") ? "open" : "closed";

//     await DeviceStatus.findOneAndUpdate(
//       { device },
//       { status, updatedAt: new Date() },
//       { upsert: true, new: true }
//     );

//     res.json({ message: "Command sent", data: newCommand });

//   } catch (error) {
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// });

// // ─────────────────────────────────────────
// //  الـ Raspberry Pi يسأل عن أوامر جديدة
// //  GET /api/device/commands/pending
// // ─────────────────────────────────────────
// router.get("/commands/pending", async (req, res) => {
//   try {
//     const command = await DeviceCommand.findOne({
//       status: "pending",
//       createdAt: { $gte: new Date(Date.now() - 30000) }
//     }).sort({ createdAt: 1 });

//     if (!command) {
//       return res.json({ command: null });
//     }

//     res.json({ commandId: command._id, command: command.command });

//   } catch (error) {
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// });

// // ─────────────────────────────────────────
// //  الـ Raspberry Pi يبعت "خلصت"
// //  POST /api/device/command/done
// //  body: { "commandId": "xxx" }
// // ─────────────────────────────────────────
// router.post("/command/done", async (req, res) => {
//   try {
//     const { commandId } = req.body;

//     if (!commandId) {
//       return res.status(400).json({ message: "commandId is required" });
//     }

//     await DeviceCommand.findByIdAndUpdate(commandId, { status: "done" });
//     res.json({ message: "Command marked as done" });

//   } catch (error) {
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// });

// // ─────────────────────────────────────────
// //  الموبايل يسأل عن حالة الأجهزة
// //  GET /api/device/status
// // ─────────────────────────────────────────
// router.get("/status", authMiddleware, async (req, res) => {
//   try {
//     const gate = await DeviceStatus.findOne({ device: "gate" });
//     const camera = await DeviceStatus.findOne({ device: "camera" });

//     res.json({
//       gate: gate ? gate.status : "unknown",
//       camera: camera ? camera.status : "unknown",
//     });

//   } catch (error) {
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// });

// export default router;

/////////////////////////////////////////////////////////////////////////////////
// routes/deviceRoutes.js
import express from "express";
import DeviceCommand from "../models/DeviceCommand.js";
import authMiddleware from "../middleware/authMiddle.js";

const router = express.Router();

// ─────────────────────────────────────────
//  الموبايل يبعت أمر
//  POST /api/device/command
//  body: { "command": "open_gate" أو "close_gate" أو "open_camera" أو "close_camera" }
//  محتاج JWT token
// ─────────────────────────────────────────
router.post("/command", authMiddleware, async (req, res) => {
  try {
    const { command } = req.body;

    if (!command) {
      return res.status(400).json({ message: "command is required" });
    }

    if (!["open_gate", "close_gate", "open_camera", "close_camera"].includes(command)) {
      return res.status(400).json({ message: "command must be open_gate, close_gate, open_camera, or close_camera" });
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



