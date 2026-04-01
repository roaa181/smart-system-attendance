// models/DeviceStatus.js
import mongoose from "mongoose";
 
const deviceStatusSchema = new mongoose.Schema({
  device: {
    type: String,
    enum: ["gate", "camera"],
    required: true,
    unique: true,
  },
  status: {
    type: String,
    required: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});
 
const DeviceStatus = mongoose.model("DeviceStatus", deviceStatusSchema);
export default DeviceStatus;