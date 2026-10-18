"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const tasks = await queryInterface.sequelize.query(
      `SELECT id, title FROM tasks WHERE id IN (1, 2)`,
      { type: Sequelize.QueryTypes.SELECT },
    );

    const skills = await queryInterface.sequelize.query(
      `SELECT id, name FROM skills`,
      { type: Sequelize.QueryTypes.SELECT },
    );

    const skillIds = Object.fromEntries(
      skills.map((skill) => [skill.name, skill.id]),
    );

    const requiredSkills = {
      1: [
        ["HTML/CSS", 3],
        ["JavaScript", 3],
        ["React", 3],
      ],
      2: [
        ["HTML/CSS", 3],
        ["JavaScript", 4],
        ["React", 3],
        ["Testing", 2],
      ],
    };

    const existing = await queryInterface.sequelize.query(
      `SELECT task_id, skill_id FROM task_skills`,
      { type: Sequelize.QueryTypes.SELECT },
    );

    const existingPairs = new Set(
      existing.map((item) => `${item.task_id}-${item.skill_id}`),
    );

    const rows = [];

    for (const task of tasks) {
      const requirements = requiredSkills[Number(task.id)] || [];

      for (const [name, level] of requirements) {
        const skillId = skillIds[name];

        if (!skillId) {
          throw new Error(`Skill not found: ${name}`);
        }

        const key = `${task.id}-${skillId}`;

        if (!existingPairs.has(key)) {
          rows.push({
            task_id: task.id,
            skill_id: skillId,
            required_level: level,
            created_at: new Date(),
            updated_at: new Date(),
          });
        }
      }
    }

    if (rows.length > 0) {
      await queryInterface.bulkInsert("task_skills", rows);
    }

    console.log(`${rows.length} task skills inserted.`);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("task_skills", {
      task_id: [1, 2],
    });
  },
};
