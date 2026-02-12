import mongoose from "mongoose";

const parkingLogSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true
  },
  // vehicleId: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: "Vehicle",
  //   default: null
  // },
  plateNumber: { type: String, default: null },
  entryTime: { type: Date, default: Date.now },
  exitTime: { type: Date, default: null },
  method: { type: String, enum: ["camera", "rfid"] }
});

// module.exports = mongoose.model("ParkingLog", parkingLogSchema);
const ParkingLog = mongoose.model("ParkingLog", parkingLogSchema);
export default ParkingLog;






// /////////////////////////////////////////////////////////////////////////////////
// import mongoose from "mongoose";

// const gateEventSchema = new mongoose.Schema({
//   vehicle_id: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", required: false },
//   plate_number_detected: String,
//   action: { type: String, enum: ["open", "denied"], required: true },
//   method: { type: String, enum: ["car_plate", "manual_by_guard"], required: true },
//   timestamp: { type: Date, default: Date.now }
// });

// export default mongoose.model("GateEvent", gateEventSchema);
