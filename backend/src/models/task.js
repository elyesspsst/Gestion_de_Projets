const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Task = sequelize.define(
  "Task",
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },

    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    status: {
      type: DataTypes.ENUM("todo", "in_progress", "completed", "cancelled"),
      allowNull: false,
      defaultValue: "todo",
    },

    priority: {
      type: DataTypes.ENUM("low", "medium", "high", "urgent"),
      allowNull: false,
      defaultValue: "medium",
    },

    due_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    project_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: "projects",
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },

    assigned_employee_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: "employees",
        key: "id",
      },
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    },
  },
  {
    tableName: "tasks",
    timestamps: true,
    underscored: true,
  },
);

module.exports = Task;
