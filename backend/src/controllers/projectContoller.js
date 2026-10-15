const Project = require("../models/project");
const { User } = require("../models/association");
const { Op } = require("sequelize");

const createProject = async (req, res) => {
  try {
    const { name, description, start_date, end_date, status } = req.body;

    if (!name || !start_date || !end_date || !status) {
      return res.status(400).json({
        message: "Missing required fields",
      });
    }

    const existUser = await User.findByPk(req.user.id);

    if (!existUser) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const project = await Project.create({
      name,
      description,
      start_date,
      end_date,
      status,
      created_by: existUser.id,
    });

    return res.status(201).json({
      message: "Project created successfully!",
      project,
    });
  } catch (error) {
    console.error("Error creating project:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

const getProjects = async (req, res) => {
  try {
    const projects = await Project.findAll();

    res.status(200).json({ message: "request success", projects });
  } catch (error) {
    console.error("Error getting projects", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!/^\d+$/.test(id) || BigInt(id) <= 0n) {
      return res.status(400).json({
        message: "Invalid project ID",
      });
    }

    const project = await Project.findByPk(id);

    if (!project) {
      return res.status(404).json({
        message: "Project was not found!",
      });
    }

    return res.status(200).json({
      message: "Request successful",
      project,
    });
  } catch (error) {
    console.error("Error getting project:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

const updateProject = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await Project.findByPk(id);

    if (!project) {
      return res.status(404).json({
        message: "Project was not found!",
      });
    }

    const updates = {};
    const fields = ["name", "description", "start_date", "end_date", "status"];

    for (const field of fields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    await project.update(updates);

    return res.status(200).json({
      message: "Project updated successfully!",
      project,
    });
  } catch (error) {
    console.error("Error updating project:", error);

    if (
      error.name === "SequelizeValidationError" ||
      error.name === "SequelizeUniqueConstraintError"
    ) {
      return res.status(400).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Server error",
    });
  }
};

const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await Project.findByPk(id);

    if (!project) {
      return res.status(404).json({
        message: "Project was not found!",
      });
    }

    await project.destroy();

    return res.status(200).json({
      message: "Project deleted successfully!",
    });
  } catch (error) {
    console.error("Error deleting project:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

const searchProjects = async (req, res) => {
  const { search } = req.query;

  if (!search || !search.trim()) {
    return res.status(400).json({
      message: "Search parameter is required",
    });
  }

  const conditions = [
    { name: { [Op.iLike]: `%${search}%` } },
    { description: { [Op.iLike]: `%${search}%` } },
    { status: { [Op.iLike]: `%${search}%` } },
  ];

  if (/^\d+$/.test(search.trim())) {
    conditions.push({ id: Number(search) }, { created_by: Number(search) });
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(search.trim())) {
    conditions.push({ start_date: search.trim() }, { end_date: search.trim() });
  }

  try {
    const projects = await Project.findAll({
      where: {
        [Op.or]: conditions,
      },
    });

    return res.status(200).json({
      message: "Search successful",
      projects,
    });
  } catch (error) {
    console.error("Error searching projects:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

const getProjectsPaginated = async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 10;
    const offset = Number(req.query.offset) || 0;

    const project = await Project.findAll({
      limit,
      offset,
      order: [["id", "ASC"]],
    });

    return res.status(200).json({
      message: "Request successful",
      project,
    });
  } catch (error) {
    console.error("Error getting projects:", error);
    return res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  getProjectsPaginated,
  updateProject,
  deleteProject,
  searchProjects,
};
