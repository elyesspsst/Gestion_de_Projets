"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("task_skills", {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      task_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: "tasks",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      skill_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: "skills",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      required_level: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    await queryInterface.addConstraint("task_skills", {
      fields: ["task_id", "skill_id"],
      type: "unique",
      name: "unique_task_skill",
    });

    await queryInterface.addConstraint("task_skills", {
      fields: ["required_level"],
      type: "check",
      where: {
        required_level: {
          [Sequelize.Op.between]: [1, 5],
        },
      },
      name: "task_skill_required_level_range",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("task_skills");
  },
};
