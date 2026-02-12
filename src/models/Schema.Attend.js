import mongoose from "mongoose"; // 


const attendanceSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
  action: { type: String, enum: ["checkin", "checkout"]},
  // method: { type: String, enum: ["rfid", "qr", "face", "manual"] },
  method: { type: String, required: true, default: "RFID" },
  timestamp: { type: Date, default: Date.now },
  deviceId: String,
  status: { type: String, enum: ["success", "denied"], default: "success" }
}, { timestamps: true });


export default mongoose.model("Attendance", attendanceSchema);
