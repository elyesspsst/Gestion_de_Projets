"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const skills = [
      { name: "JavaScript" },
      { name: "React" },
      { name: "Node.js" },
      { name: "Express.js" },
      { name: "PostgreSQL" },
      { name: "Sequelize" },
      { name: "HTML/CSS" },
      { name: "Python" },
      { name: "Testing" },
      { name: "Docker" },
      { name: "Git" },
      { name: "UI/UX Design" },
      { name: "Business Analysis" },
    ];

    const existingSkills = await queryInterface.sequelize.query(
      'SELECT name FROM "skills"',
      { type: Sequelize.QueryTypes.SELECT },
    );

    const existingNames = existingSkills.map((skill) => skill.name);

    const newSkills = skills
      .filter((skill) => !existingNames.includes(skill.name))
      .map((skill) => ({
        ...skill,
        created_at: new Date(),
        updated_at: new Date(),
      }));

    if (newSkills.length > 0) {
      await queryInterface.bulkInsert("skills", newSkills);
    }

    console.log(`${newSkills.length} new skills inserted.`);
  },

  async down(queryInterface) {
    const skillNames = [
      "JavaScript",
      "React",
      "Node.js",
      "Express.js",
      "PostgreSQL",
      "Sequelize",
      "HTML/CSS",
      "Python",
      "Testing",
      "Docker",
      "Git",
      "UI/UX Design",
      "Business Analysis",
    ];

    await queryInterface.bulkDelete("skills", {
      name: skillNames,
    });
  },
};
