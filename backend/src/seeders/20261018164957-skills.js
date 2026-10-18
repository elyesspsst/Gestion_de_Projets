"use strict";

module.exports = {
  async up(queryInterface) {
    const skills = [
      { name: "JavaScript", description: "Programming with JavaScript" },
      { name: "Node.js", description: "Server-side JavaScript development" },
      { name: "Express.js", description: "Building REST APIs with Express" },
      { name: "PostgreSQL", description: "Relational database management" },
      { name: "React", description: "Frontend development" },
      { name: "Python", description: "Python programming" },
      { name: "Git", description: "Version control" },
      { name: "SQL", description: "Database queries" },
      { name: "Testing", description: "Software testing" },
      { name: "REST API", description: "REST API development" },
    ];

    const now = new Date();

    const existingSkills = await queryInterface.sequelize.query(
      'SELECT name FROM "skills"',
      { type: queryInterface.sequelize.QueryTypes.SELECT },
    );

    const existingNames = existingSkills.map((skill) => skill.name);

    const newSkills = skills
      .filter((skill) => !existingNames.includes(skill.name))
      .map((skill) => ({
        ...skill,
        created_at: now,
        updated_at: now,
      }));

    if (newSkills.length > 0) {
      await queryInterface.bulkInsert("skills", newSkills);
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("skills", {
      name: [
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
      ],
    });
  },
};
