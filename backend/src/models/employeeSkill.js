const { DataTypes } = require("sequelize");
const sequelize = require("../config/config");

const EmployeeSkill = sequelize.define(
  "EmployeeSkill",
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },

    employee_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: { model: "employees", key: "id" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },

    skill_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: { model: "skills", key: "id" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },

    level: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5,
      },
    },
  },
  {
    tableName: "employee_skills",
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ["employee_id", "skill_id"],
      },
    ],
  },
);

module.exports = EmployeeSkill;
