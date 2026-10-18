const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const requireAdmin = require("../middlewares/requireAdmin");

const {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  searchTasks,
  getTasksPagination,
} = require("../controllers/taskControllers");

//chef de projet + Admin

router.post("/", authMiddleware, createTask);
router.get("/", authMiddleware, requireAdmin, getTasks);
router.get("/", authMiddleware, requireAdmin, getTaskById);
router.get("/", authMiddleware, requireAdmin, updateTask);
router.delete("/", authMiddleware, requireAdmin, deleteTask);
router.get("/", authMiddleware, requireAdmin, searchTasks);
router.get("/", authMiddleware, requireAdmin, getTasksPagination);

module.exports = router;
