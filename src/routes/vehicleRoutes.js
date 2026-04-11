import express from "express";
const router = express.Router();
import {registerVehicle} from "../controllers/vehicleController.js";
import authMiddleware from "../middleware/authMiddle.js";

router.post("/register", authMiddleware, registerVehicle);




export default router;
