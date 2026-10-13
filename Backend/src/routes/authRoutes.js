const express = require("express");
const router = express.Router();
const {
  register,
  login,
  getMe,
  logOut,
  googleAuth,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");
const { authMiddleware } = require("../middlewares/authMiddleware");

router.post("/register", register);
router.post("/login", login);
router.get("/me", authMiddleware, getMe);
router.post("/logout", logOut);
router.post("/google", googleAuth);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

module.exports = router;
