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
import sendChangeEmailOtpController from "../controllers/auth/sendChangeEmailOtp.js";
import changeEmailController from "../controllers/auth/changeEmail.js";
import {
  validateChangePassword,
  validateForgotPassword,
  validateLogin,
  validateRegister,
  validateResetPassword,
  validateSendChangeEmailOtp,
  validateChangeEmail,
  validateSendOtp,
} from "../validators/auth/index.js";

const imageFileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/jpg",
  ];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error(
      "Only .jpg, .jpeg, .png, and .webp images are allowed.",
    );
    error.statusCode = 400;
    cb(error, false);
  }
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: imageFileFilter,
});

const router = express.Router();

router.post("/register", validateRegister, register);
router.post("/send-otp", validateSendOtp, sendOtp);
router.post("/login", validateLogin, login);
router.get("/me", authMiddleware, getMe);
router.post("/logout", logOut);
router.post("/google", googleAuth);
router.post("/forgot-password", validateForgotPassword, forgotPassword);
router.post("/reset-password", validateResetPassword, resetPassword);
router.put(
  "/change-password",
  authMiddleware,
  validateChangePassword,
  changePassword,
);
router.patch("/avatar", authMiddleware, upload.single("avatar"), updateAvatar);
router.post(
  "/send-change-email-otp",
  authMiddleware,
  validateSendChangeEmailOtp,
  sendChangeEmailOtpController,
);

router.put(
  "/change-email",
  authMiddleware,
  validateChangeEmail,
  changeEmailController,
);

export default router;
