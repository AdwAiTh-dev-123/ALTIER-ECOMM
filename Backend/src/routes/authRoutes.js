import express from "express";
import multer from "multer";
import register from "../controllers/auth/register.js";
import sendOtp from "../controllers/auth/sendOtp.js";
import login from "../controllers/auth/login.js";
import getMe from "../controllers/auth/getMe.js";
import logOut from "../controllers/auth/logout.js";
import googleAuth from "../controllers/auth/googleAuth.js";
import forgotPassword from "../controllers/auth/forgotPassword.js";
import resetPassword from "../controllers/auth/resetPassword.js";
import changePassword from "../controllers/auth/changePassword.js";
import updateAvatar from "../controllers/auth/updateAvatar.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

const router = express.Router();

router.post("/register", register);
router.post("/send-otp", sendOtp);
router.post("/login", login);
router.get("/me", authMiddleware, getMe);
router.post("/logout", logOut);
router.post("/google", googleAuth);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.put("/change-password", authMiddleware, changePassword);
router.patch("/avatar", authMiddleware, upload.single("avatar"), updateAvatar);

export default router;
