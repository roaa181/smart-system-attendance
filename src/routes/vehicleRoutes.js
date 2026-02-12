import express from "express";
const router = express.Router();
import {registerVehicle} from "../controllers/vehicleController.js";

router.post("/register", registerVehicle);

export default router;
