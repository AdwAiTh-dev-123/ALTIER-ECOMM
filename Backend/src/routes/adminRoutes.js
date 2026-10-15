const express = require("express");
const router = express.Router();

const { authMiddleware } = require("../middlewares/authMiddleware");
const { adminMiddleware } = require("../middlewares/adminMiddleware");
const {
  getAllUsers,
  toggleisBlocked,
} = require("../controllers/admin/userAdminController");

router.use(authMiddleware, adminMiddleware);

router.get("/users", getAllUsers);
router.patch("/users/:id", toggleisBlocked);

module.exports = router;
