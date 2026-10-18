const { DataTypes } = require("sequelize");
const sequelize = require("../config/config");

const Skill = sequelize.define(
  "Skill",
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },

    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "skills",
    timestamps: true,
    underscored: true,
  },
);

module.exports = Skill;
