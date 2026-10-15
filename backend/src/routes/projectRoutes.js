const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const requireAdmin = require("../middlewares/requireAdmin");

const {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  searchProjects,
  getProjectsPaginated,
} = require("../controllers/projectContoller");

//user
router.get("/my-view", authMiddleware, getProjectsPaginated);

//admin
router.post("/", authMiddleware, requireAdmin, createProject);
router.get("/", authMiddleware, requireAdmin, getProjects);
router.get("/search", authMiddleware, requireAdmin, searchProjects);
router.get("/:id", authMiddleware, requireAdmin, getProjectById);
router.put("/:id", authMiddleware, requireAdmin, updateProject);
router.delete("/:id", authMiddleware, requireAdmin, deleteProject);

module.exports = router;
