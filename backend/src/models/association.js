const sequelize = require("../config/config");

const User = require("./user");

const createEmployee = require("./employee");
const Employee = createEmployee(sequelize);

// Project and Task are already initialized in their own files
const Project = require("./project");
const Task = require("./task");

// User - Employee
User.hasOne(Employee, {
  foreignKey: "user_id",
  as: "employee",
});

Employee.belongsTo(User, {
  foreignKey: "user_id",
  as: "user",
});

// User - Project
User.hasMany(Project, {
  foreignKey: "created_by",
  as: "createdProjects",
});

Project.belongsTo(User, {
  foreignKey: "created_by",
  as: "creator",
});

// Project - Task
Project.hasMany(Task, {
  foreignKey: "project_id",
  as: "tasks",
});

Task.belongsTo(Project, {
  foreignKey: "project_id",
  as: "project",
});

// Employee - Task
Employee.hasMany(Task, {
  foreignKey: "assigned_employee_id",
  as: "assignedTasks",
});

Task.belongsTo(Employee, {
  foreignKey: "assigned_employee_id",
  as: "assignedEmployee",
});

module.exports = {
  sequelize,
  User,
  Employee,
  Project,
  Task,
};
