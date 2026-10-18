const { Task, Notification } = require("../models/association");

const createTask = async (req, res) => {
  try {
    const {
      id,
      title,
      description,
      status,
      priority,
      due_date,
      project_id,
      assigned_employee_id,
    } = req.body;

    if (
      !title ||
      !status ||
      !priority ||
      !due_date ||
      !project_id ||
      !assigned_employee_id
    ) {
      return res.status(404).json({ message: "Missing fields" });
    }

    const existTask = await Task.findOne({
      where: {
        title: req.body.title,
        id: req.user.id,
      },
    });
    if (existTask) {
      return res.status(404).json({ message: "User already exists" });
    }

    const task = await Task.create({
      id,
      title,
      description,
      status,
      priority,
      due_date,
      project_id,
      assigned_employee_id,
    });

    await Notification.create({
      employee_id: assigned_employee_id,
      task_id: task.id,
      message: `You have been assigned a new task: ${title}`,
      type: "TASK_ASSIGNED",
    });

    return res.status(201).json({
      message: "Task created successfully",
      task,
    });
  } catch (error) {
    console.error("Error task created", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getTasks = async (req, res) => {
  try {
    const tasks = await Tasks.findAll();

    res.status(200).json({ message: "Request Success", tasks });
  } catch (error) {
    console.error("Error fetching tasks", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getTaskById = async (req, res) => {
  try {
    const task = await Tasks.findByPk(req.params.id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.status(200).json({ message: "Request Success", task });
  } catch (error) {
    console.error("Error fetching task", error);
    res.status(500).json({ message: "Server error" });
  }
};

const updateTask = async (req, res) => {
  try {
    const task = await Tasks.findByPk(req.params.id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const updates = {};

    const fields = [
      "title",
      "description",
      "status",
      "priority",
      "due_date",
      "project_id",
      "assigned_employee_id",
    ];

    for (const field of fields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    await task.update(updates);

    res.status(200).json({
      message: "Task updated successfully",
      task,
    });
  } catch (error) {
    console.error("Error updating task", error);
    res.status(500).json({ message: "Server error" });
  }
};

const deleteTask = async (req, res) => {
  try {
    const task = await Tasks.findByPk(req.params.id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    await task.destroy();

    res.status(200).json({
      message: "Task deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting task", error);
    res.status(500).json({ message: "Server error" });
  }
};

const { Op } = require("sequelize");

const searchTasks = async (req, res) => {
  try {
    const { title } = req.query;

    if (!title) {
      return res.status(400).json({
        message: "Please provide a task title to search",
      });
    }

    const tasks = await Tasks.findAll({
      where: {
        title: {
          [Op.iLike]: `%${title}%`,
        },
      },
    });

    res.status(200).json({
      message: "Search successful",
      tasks,
    });
  } catch (error) {
    console.error("Error searching tasks", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getTasksPagination = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const offset = (page - 1) * limit;

    const { count, rows: tasks } = await Tasks.findAndCountAll({
      limit,
      offset,
      order: [["id", "ASC"]],
    });

    res.status(200).json({
      message: "Request Success",
      totalTasks: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      tasks,
    });
  } catch (error) {
    console.error("Error fetching tasks", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  searchTasks,
  getTasksPagination,
};
