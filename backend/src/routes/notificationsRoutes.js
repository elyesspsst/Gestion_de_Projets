const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");

const { getNotifications } = require("../controllers/notificationsController");

// Get notifications of the connected user
router.get("/", authMiddleware, getNotifications);

module.exports = router;
