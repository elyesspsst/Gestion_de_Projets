const sequelize = require("../config/config");
const { DataTypes } = require("sequelize");

const User = require("./user");

const createEmployee = require("./employee");
const createNotification = require("./notifications");

// Initialize models
const Employee = createEmployee(sequelize);
const Project = require("./project");
const Task = require("./task");
const Notification = createNotification(sequelize, DataTypes);
const Skill = require("./skill");
const EmployeeSkill = require("./employeeSkill");
const TaskSkill = require("./taskSkill");

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

// Employee - Notification
Employee.hasMany(Notification, {
  foreignKey: "employee_id",
  as: "notifications",
});

Notification.belongsTo(Employee, {
  foreignKey: "employee_id",
  as: "employee",
});

// Task - Notification
Task.hasMany(Notification, {
  foreignKey: "task_id",
  as: "notifications",
});

Notification.belongsTo(Task, {
  foreignKey: "task_id",
  as: "task",
});

// Employee - EmployeeSkill
Employee.hasMany(EmployeeSkill, {
  foreignKey: "employee_id",
  as: "employeeSkills",
});

EmployeeSkill.belongsTo(Employee, {
  foreignKey: "employee_id",
  as: "employee",
});

// Skill - EmployeeSkill
Skill.hasMany(EmployeeSkill, {
  foreignKey: "skill_id",
  as: "employeeSkills",
});

EmployeeSkill.belongsTo(Skill, {
  foreignKey: "skill_id",
  as: "skill",
});

// Task - TaskSkill
Task.hasMany(TaskSkill, {
  foreignKey: "task_id",
  as: "requiredSkills",
});

TaskSkill.belongsTo(Task, {
  foreignKey: "task_id",
  as: "task",
});

// Skill - TaskSkill
Skill.hasMany(TaskSkill, {
  foreignKey: "skill_id",
  as: "taskSkills",
});

TaskSkill.belongsTo(Skill, {
  foreignKey: "skill_id",
  as: "skill",
});

module.exports = {
  sequelize,
  User,
  Employee,
  Project,
  Task,
  Notification,
  Skill,
  EmployeeSkill,
  TaskSkill,
};
