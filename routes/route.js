import express from "express";
const router = express.Router();

import {
  loginController,
  signupController,
} from "../controllers/authController.js";

router.get("/login", loginController);
router.get("/signup", signupController);

export default router;
