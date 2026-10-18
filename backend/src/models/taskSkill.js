const { DataTypes } = require("sequelize");
const sequelize = require("../config/config");

const TaskSkill = sequelize.define(
  "TaskSkill",
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },

    task_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: { model: "tasks", key: "id" },
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

    required_level: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5,
      },
    },
  },
  {
    tableName: "task_skills",
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ["task_id", "skill_id"],
      },
    ],
  },
);

module.exports = TaskSkill;
