import express from "express";
const router = express.Router();

import {
  loginController,
  refreshTokenController,
  signupController,
} from "../controllers/authController.js";

router.post("/login", loginController);
router.post("/signup", signupController);
router.post("/refreshData", refreshTokenController);

export default router;
