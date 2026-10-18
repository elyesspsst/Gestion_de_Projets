const { DataTypes } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  const Notifications = sequelize.define(
    "Notification",
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },

      employee_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: "employees",
          key: "id",
        },
        onDelete: "CASCADE",
      },

      task_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
        references: {
          model: "tasks",
          key: "id",
        },
        onDelete: "SET NULL",
      },

      message: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },

      type: {
        type: DataTypes.ENUM("TASK_ASSIGNED", "DEADLINE_APPROACHING"),
        allowNull: false,
      },

      is_read: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      tableName: "notifications",
      timestamps: true,
    },
  );

  return Notifications;
};
