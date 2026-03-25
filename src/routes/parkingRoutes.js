import express from "express";
const router = express.Router();
import parkingController from "../controllers/parkingController.js";

router.post("/enter/camera", parkingController.enterByCamera);
router.post("/enter/rfid", parkingController.enterByRFID);
router.post("/exit", parkingController.exitParking);

export default router;
