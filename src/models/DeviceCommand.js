// models/DeviceCommand.js
import mongoose from "mongoose";

const deviceCommandSchema = new mongoose.Schema({
  command: {
    type: String,
    enum: ["open_gate", "close_gate", "open_camera", "close_camera"],
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "done"],
    default: "pending",
  },
  // issuedBy: {             // اسم الشخص اللي أصدر الأمر
  //   type: String,
  //   required: true,
  // },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const DeviceCommand = mongoose.model("DeviceCommand", deviceCommandSchema);
export default DeviceCommand;
