import dotenv from "dotenv";
dotenv.config();

import express from "express";
import mongoose from "mongoose";

import authRoutes from "./routes/auth.js";
import CardRoutes from "./routes/CardRoutes.js";
import attendanceRoutes from "./routes/attendance.js";
import faceRoutes from "./routes/faceRoutes.js";
import vehicleRoutes from "./routes/vehicleRoutes.js";
import parkingRoutes from "./routes/parkingRoutes.js";
import rfidRoutes from "./routes/rfidRoutes.js";
import employeeRoutes from "./routes/employeeRoutes.js";
import qrRoutes from "./routes/qrRoutes.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// ─────────────────────────────────────────
//   MongoDB Connection
// ─────────────────────────────────────────
const MONGO_URI = process.env.MONGO_URI 
  || "mongodb://mongo:uEtuYoZoHzOmlXcYkQzmOOHycOskXmUO@mongodb.railway.internal:27017"
  // || "mongodb://localhost:27017/project";

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("Connected to MongoDB successfully"))
  .catch((err) => console.log("Connection Error:", err));

// ─────────────────────────────────────────
//   Routes
// ─────────────────────────────────────────
app.use("/api/auth", authRoutes);             // login / signup / logout / OTP
app.use("/api/attendance", attendanceRoutes); // تسجيل الحضور (card / face / qr)
app.use("/api/card", CardRoutes);             // ربط الكارت بموظف
app.use("/api/face", faceRoutes);             // ربط الـ Face ID
app.use("/api/vehicle", vehicleRoutes);       // تسجيل العربيات
app.use("/api/parking", parkingRoutes);       // دخول وخروج الباركنج
app.use("/api/rfid", rfidRoutes);             // RFID attendance
app.use("/api/employee", employeeRoutes); 
app.use("/api/qr", qrRoutes);    // profile

// ─────────────────────────────────────────
//   Start Server
// ─────────────────────────────────────────
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});

///////
///////////////////////////////////////////////////////////////////////






