const {
  User,
  Employee,
  Project,
  Task,
  sequelize,
} = require("../models/association");
const { Op, where } = require("sequelize");

const getEmployees = async (req, res) => {
  try {
    const employees = await User.findAll({
      attributes: { exclude: ["password"] },
      include: [
        {
          model: Employee,
          as: "employee",
          attributes: ["profile_picture", "phone"],
          required: true,
        },
      ],
      order: [["full_name", "ASC"]],
    });
    if (employees.length === 0) {
      return res.json({ message: "No Employees found" });
    }

    res.status(200).json({ message: "request success", employees });
  } catch (error) {
    console.error("Get employees error:", error);
    return res.status(500).json({ message: "Error finding employees" });
  }
};

const getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "full_name", "email", "role"],
        },
      ],
    });

    if (!employee) {
      return res.status(404).json({
        message: "No employee found!",
      });
    }

    return res.status(200).json({
      message: "Request successful",
      employee,
    });
  } catch (error) {
    console.error("Get Employee error:", error);

    return res.status(500).json({
      message: "Error getting employee",
    });
  }
};

const searchEmployees = async (req, res) => {
  try {
    const { search } = req.query;

    if (!search || !search.trim()) {
      return res.status(400).json({
        message: "Search parameter is required",
      });
    }

    const conditions = [
      { "$user.full_name$": { [Op.iLike]: `%${search}%` } },
      { "$user.email$": { [Op.iLike]: `%${search}%` } },
      { phone: { [Op.iLike]: `%${search}%` } },
      { department: { [Op.iLike]: `%${search}%` } },
    ];

    if (/^\d+$/.test(search.trim())) {
      conditions.push({ id: Number(search) }, { "$user.id$": Number(search) });
    }

    const employees = await Employee.findAll({
      where: {
        [Op.or]: conditions,
      },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "full_name", "email", "role"],
          required: false,
        },
      ],
    });

    return res.status(200).json(employees);
  } catch (error) {
    console.error("Search Employee Error:", error);

    return res.status(500).json({
      message: "Error searching employees",
      error: error.message,
    });
  }
};

const deleteEmployee = async (req, res) => {
  try {
    const result = await sequelize.transaction(async (transaction) => {
      const employee = await Employee.findByPk(req.params.id, {
        include: [
          {
            model: User,
            as: "user",
            attributes: ["id", "full_name", "email", "role"],
          },
        ],
        transaction,
      });

      if (!employee) {
        const error = new Error("Employee not found");
        error.status = 404;
        throw error;
      }

      if (!employee.user) {
        const error = new Error("Associated user not found");
        error.status = 409;
        throw error;
      }

      // 2. Check whether the user created projects
      const projectsCount = await Project.count({
        where: {
          created_by: employee.user_id,
        },
        transaction,
      });

      if (projectsCount > 0) {
        const error = new Error(
          "Cannot delete employee: user has created projects",
        );
        error.status = 409;
        error.projectsCount = projectsCount;
        throw error;
      }

      // 3. Check whether the employee is assigned to tasks
      const tasksCount = await Task.count({
        where: {
          assigned_employee_id: employee.id,
        },
        transaction,
      });

      if (tasksCount > 0) {
        const error = new Error(
          "Cannot delete employee: employee has assigned tasks",
        );
        error.status = 409;
        error.tasksCount = tasksCount;
        throw error;
      }

      // 4. Save IDs before deleting
      const employeeId = employee.id;
      const userId = employee.user.id;

      // 5. Delete employee first
      await employee.destroy({ transaction });

      // 6. Delete associated user
      await employee.user.destroy({ transaction });

      // 7. Return success data
      return {
        message: "Employee and user deleted successfully",
        employeeId,
        userId,
      };
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error("Delete employee error:", error);

    return res.status(error.status || 500).json({
      message: error.message || "Error deleting employee and user",
      ...(error.projectsCount !== undefined && {
        projectsCount: error.projectsCount,
      }),
      ...(error.tasksCount !== undefined && {
        tasksCount: error.tasksCount,
      }),
    });
  }
};

module.exports = {
  getEmployees,
  getEmployeeById,
  searchEmployees,
  deleteEmployee,
};
