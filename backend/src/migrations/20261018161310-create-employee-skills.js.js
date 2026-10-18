"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("employee_skills", {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      employee_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: "employees",
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
      level: {
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

    await queryInterface.addConstraint("employee_skills", {
      fields: ["employee_id", "skill_id"],
      type: "unique",
      name: "unique_employee_skill",
    });

    await queryInterface.addConstraint("employee_skills", {
      fields: ["level"],
      type: "check",
      where: {
        level: {
          [Sequelize.Op.between]: [1, 5],
        },
      },
      name: "employee_skill_level_range",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("employee_skills");
  },
};
