import express from "express";
const router = express.Router();
import {registerVehicle} from "../controllers/vehicleController.js";
import authMiddleware from "../middleware/authMiddleware.js";

router.post("/register", authMiddleware, registerVehicle);




export default router;
