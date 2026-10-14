const express = require("express");
const router = express.Router();

const { getProfile, updateProfile } = require("../controllers/userController");

const authMiddleware = require("../middlewares/authMiddleware");
const uploadProfilePhoto = require("../middlewares/uploadProfilePhoto");

router.get("/", authMiddleware, getProfile);
router.put("/", authMiddleware, uploadProfilePhoto, updateProfile);

module.exports = router;
