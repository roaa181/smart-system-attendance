
// import express from "express";
// import mongoose from "mongoose";
// import authRoutes from "./routes/auth.js";


// const app = express();
// const PORT = process.env.PORT || 3000;

// app.use(express.json());

// //
// mongoose.connect("mongodb://localhost:27017/project")
//   .then(() => console.log("Connected to MongoDB"))
//   .catch((err) => console.log("Connection Error:", err));

// // Routes
// app.use("/api/auth", authRoutes);

// app.listen(PORT, "0.0.0.0", () => {
//   console.log(`Server running on http://192.168.100.30:${PORT}`);
// });

// ///////////////////////////////////////////////////////////////////////
import express from "express";
import mongoose from "mongoose";

import authRoutes from "./routes/auth.js";
import CardRoutes from "./routes/CardRoutes.js";
import attendanceRoutes from "./routes/attendance.js";
import faceRoutes from "./routes/faceRoutes.js";
import vehicleRoutes from "./routes/vehicleRoutes.js";
import parkingRoutes from "./routes/parkingRoutes.js";
import authMiddleware from "./middleware/authMiddle.js";






const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// MongoDB 
mongoose.connect("mongodb://localhost:27017/project")
  .then(() => console.log("Connected to MongoDB successfully"))
  .catch(err => console.log("Connection Error:", err));

// Routes
app.use("/api/auth", authRoutes);           // login / signup / logout
app.use("/api/attendance", attendanceRoutes); // تسجيل الحضور
app.use("/api/card", CardRoutes);    // إضافة / ربط الكارت
app.use("/api/face", faceRoutes);          // ربط الـ Face ID
app.use("/api/vehicle", vehicleRoutes);    // تسجيل العربيات
app.use("/api/parking", parkingRoutes);    // دخول وخروج الباركنج

// app.use('/api', attendanceRoutes); // لو حبيت تخلي الراوت الأساسي للتسجيل في /api بدل /api/attendance



// ///////////////////////////////////////////////////



app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://192.168.8.124:${PORT}`);
});

// ///////
/////////////////////////////////////////////////////////////////////////






