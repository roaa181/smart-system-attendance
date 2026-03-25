import express from "express";
import  {assignCardAuto} from "../controllers/CardController.js";

const router = express.Router();

// router.post("/assign-Card", assignCardToEmployee);
router.post("/assign-card-auto", assignCardAuto);


export default router;
//////////////////////////////////

