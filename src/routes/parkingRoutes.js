import express from "express";
const router = express.Router();
import parkingController from "../controllers/parkingController.js";

router.post("/enter/camera", parkingController.enterByCamera);
router.post("/enter/rfid", parkingController.enterByRFID);
router.post("/exit", parkingController.exitParking);
// router.get("/status", parkingController.getParkingStatus);
router.get("/report", parkingController.getParkingReport);

export default router;
