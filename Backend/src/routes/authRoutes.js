const express = require("express");
const router = express.Router();
const register = require("../controllers/auth/register");
const login = require("../controllers/auth/login");
const getMe = require("../controllers/auth/getMe");
const logOut = require("../controllers/auth/logout");
const googleAuth = require("../controllers/auth/googleAuth");
const forgotPassword = require("../controllers/auth/forgotPassword");
const resetPassword = require("../controllers/auth/resetPassword");
const { authMiddleware } = require("../middlewares/authMiddleware");

router.post("/register", register);
router.post("/login", login);
router.get("/me", authMiddleware, getMe);
router.post("/logout", logOut);
router.post("/google", googleAuth);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

module.exports = router;
