const { Notification, Employee } = require("../models/association");

// Get notifications of the connected employee
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    const employee = await Employee.findOne({
      where: { user_id: userId },
    });

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found",
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const result = await Notification.findAndCountAll({
      where: {
        employee_id: employee.id,
      },
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    return res.status(200).json({
      notifications: result.rows,
      total: result.count,
      page,
      limit,
      totalPages: Math.ceil(result.count / limit),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error retrieving notifications",
      error: error.message,
    });
  }
};

module.exports = { getNotifications };
