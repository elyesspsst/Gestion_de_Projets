"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const skills = await queryInterface.sequelize.query(
      'SELECT id, name FROM "skills"',
      {
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    const employees = await queryInterface.sequelize.query(
      `SELECT id FROM employees ORDER BY id`,
      {
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    const skillIds = Object.fromEntries(
      skills.map((skill) => [skill.name, skill.id]),
    );

    // Employee ID => skills and proficiency levels
    const employeeSkills = {
      1: [
        ["JavaScript", 3],
        ["Node.js", 3],
        ["SQL", 3],
        ["Git", 2],
      ],
      2: [
        ["JavaScript", 4],
        ["Node.js", 4],
        ["Express.js", 4],
        ["Sequelize", 3],
        ["REST API", 4],
        ["Git", 3],
      ],
      3: [
        ["JavaScript", 4],
        ["React", 4],
        ["HTML/CSS", 4],
        ["Git", 3],
      ],
      4: [
        ["Testing", 4],
        ["SQL", 2],
        ["REST API", 2],
        ["Python", 2],
      ],
      5: [
        ["PostgreSQL", 4],
        ["SQL", 5],
        ["Sequelize", 3],
        ["Python", 2],
      ],
      6: [
        ["Docker", 4],
        ["Git", 4],
        ["Node.js", 2],
        ["REST API", 2],
      ],
      7: [
        ["UI/UX Design", 5],
        ["HTML/CSS", 3],
        ["React", 2],
      ],
      8: [
        ["JavaScript", 4],
        ["React", 3],
        ["Node.js", 4],
        ["Express.js", 4],
        ["PostgreSQL", 3],
        ["Git", 4],
      ],
      9: [
        ["Business Analysis", 5],
        ["SQL", 3],
        ["REST API", 3],
        ["Testing", 2],
      ],
    };

    const existing = await queryInterface.sequelize.query(
      `SELECT employee_id, skill_id FROM employee_skills`,
      {
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    const existingPairs = new Set(
      existing.map((item) => `${item.employee_id}-${item.skill_id}`),
    );

    const rows = [];

    for (const employee of employees) {
      const skillsForEmployee = employeeSkills[Number(employee.id)] || [];

      for (const [name, level] of skillsForEmployee) {
        const skillId = skillIds[name];

        if (!skillId) {
          throw new Error(`Skill not found: ${name}`);
        }

        const key = `${employee.id}-${skillId}`;

        if (!existingPairs.has(key)) {
          rows.push({
            employee_id: employee.id,
            skill_id: skillId,
            level,
            created_at: new Date(),
            updated_at: new Date(),
          });
        }
      }
    }

    if (rows.length > 0) {
      await queryInterface.bulkInsert("employee_skills", rows);
    }

    console.log(`${rows.length} employee skills inserted.`);
  },

  async down(queryInterface) {
    const skillNames = [
      "JavaScript",
      "Node.js",
      "Express.js",
      "PostgreSQL",
      "React",
      "Python",
      "Git",
      "SQL",
      "Testing",
      "REST API",
      "Sequelize",
      "HTML/CSS",
      "Docker",
      "UI/UX Design",
      "Business Analysis",
    ];

    const skills = await queryInterface.sequelize.query(
      `SELECT id FROM "skills" WHERE name IN (:skillNames)`,
      {
        replacements: { skillNames },
        type: queryInterface.sequelize.QueryTypes.SELECT,
      },
    );

    await queryInterface.bulkDelete("employee_skills", {
      skill_id: skills.map((skill) => skill.id),
    });
  },
};
