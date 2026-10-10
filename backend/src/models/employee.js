const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Employee = sequelize.define(
    "Employee",
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },

      user_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        unique: true,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },

      job_title: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },

      department: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
    },
    {
      tableName: "employees",
      timestamps: true,
      underscored: true,
    },
  );

  module.exports = Employee;
};
