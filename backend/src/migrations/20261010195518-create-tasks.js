"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("tasks", {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },

      title: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },

      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      status: {
        type: Sequelize.ENUM("NOT_STARTED", "IN_PROGRESS", "COMPLETED"),
        allowNull: false,
        defaultValue: "NOT_STARTED",
      },

      priority: {
        type: Sequelize.ENUM("LOW", "MEDIUM", "HIGH"),
        allowNull: false,
        defaultValue: "MEDIUM",
      },

      due_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },

      project_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: "projects",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },

      assigned_employee_id: {
        type: Sequelize.BIGINT,
        allowNull: true,
        references: {
          model: "employees",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },

      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },

      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("tasks");

    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_tasks_status";
      DROP TYPE IF EXISTS "enum_tasks_priority";
    `);
  },
};
