import express from "express";
import authMiddleware from "../middleware/authMiddle.js";
import { getProfile, updateProfile } from "../controllers/employeeController.js";

const router = express.Router();

router.get("/profile", authMiddleware, getProfile);
router.put("/update-profile", authMiddleware, updateProfile);

export default router;