//                                  الراوت الخاص 
// import express from "express";
// import { createAttendance } from "../controllers/attendanceController.js";

import express from "express";
import {createAttendanceByCard, createAttendanceByFace}
 from "../controllers/attendanceController.js";
import authMiddleware from "../middleware/authMiddle.js";
import { getMonthlyReport } from "../controllers/attendanceController.js";

const router = express.Router();

router.post("/card", createAttendanceByCard);
router.post("/face", createAttendanceByFace);


router.get("/report", authMiddleware, getMonthlyReport);

// //////////////////////////////////////////////////////////////////////////

// import authMiddleware from "../middleware/auth.js";

// ////////////////////////////////////////////////////////

//                           لو حبيت تضيف حماية بالتوكن


// router.post("/mark", authMiddleware, async (req, res) => {
//   res.json({ message: "Attendance recorded", user: req.user });
// });

// ///////////////////////////////////////////////////////////////////////////////
                                  //  simple attendance record //
// import { getSimpleAttendance }  from "../controllers/attendanceController.js";
// const auth = require('../middleware/auth'); // لو عندك JWT

// router.get('/attendance/simple', auth, getSimpleAttendance);
// لو مفيش auth
// router.get('/attendance/simple', getSimpleAttendance);




export default router;
