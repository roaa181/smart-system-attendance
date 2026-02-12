import mongoose from "mongoose";

const vehicleSchema = new mongoose.Schema({
  
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
  plateNumber: { type: String, unique: true },
  // plate_photo: String,  
  created_at: { type: Date, default: Date.now }
});

export default mongoose.model("Vehicle", vehicleSchema);
