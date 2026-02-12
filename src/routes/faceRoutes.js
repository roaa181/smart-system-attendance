import express from "express";
import { assignFaceByEmployeeNumber } from "../controllers/faceController.js";

const router = express.Router();

// تسجيل Face ID لموظف
router.post("/assign", assignFaceByEmployeeNumber);

export default router;
