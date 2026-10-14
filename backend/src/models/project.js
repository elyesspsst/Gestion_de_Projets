const { DataTypes } = require("sequelize");
const sequelize = require("../config/config");

const Project = sequelize.define(
  "Project",
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },

    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    end_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        isAfterStartDate(value) {
          if (value < this.start_date) {
            throw new Error(
              "La date de fin doit être supérieure ou égale à la date de début.",
            );
          }
        },
      },
    },

    status: {
      type: DataTypes.ENUM("planned", "in_progress", "completed", "cancelled"),
      allowNull: false,
      defaultValue: "planned",
    },

    created_by: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      onDelete: "RESTRICT",
      onUpdate: "CASCADE",
    },
  },
  {
    tableName: "projects",
    timestamps: true,
    underscored: true,
  },
);

module.exports = Project;
