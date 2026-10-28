import express from "express";
import register from "../controllers/auth/register.js";
import sendOtp from "../controllers/auth/sendOtp.js";
import login from "../controllers/auth/login.js";
import getMe from "../controllers/auth/getMe.js";
import logOut from "../controllers/auth/logout.js";
import googleAuth from "../controllers/auth/googleAuth.js";
import forgotPassword from "../controllers/auth/forgotPassword.js";
import resetPassword from "../controllers/auth/resetPassword.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/send-otp", sendOtp);
router.post("/login", login);
router.get("/me", authMiddleware, getMe);
router.post("/logout", logOut);
router.post("/google", googleAuth);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;
