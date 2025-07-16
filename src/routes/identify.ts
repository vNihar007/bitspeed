import express from "express";
import { identify } from "../contollers/identifyController";

const router = express.Router();
router.post('/', identify);

export default router;
