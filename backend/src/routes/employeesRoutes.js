const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const requireAdmin = require("../middlewares/requireAdmin");

const {
  getEmployees,
  getEmployeeById,
  searchEmployees,
  deleteEmployee,
} = require("../controllers/employeesController");

// Search employees
router.get("/search", authMiddleware, requireAdmin, searchEmployees);

// Get all employees
router.get("/", authMiddleware, requireAdmin, getEmployees);

// Get employee by ID
router.get("/:id", authMiddleware, requireAdmin, getEmployeeById);

// Delete employee and associated user
router.delete("/:id", authMiddleware, requireAdmin, deleteEmployee);

module.exports = router;
