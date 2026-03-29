import express from "express";
import  {assignCard} from "../controllers/CardController.js";

const router = express.Router();

// router.post("/assign-Card", assignCardToEmployee);
router.post("/assign", assignCard);


export default router;
//////////////////////////////////

