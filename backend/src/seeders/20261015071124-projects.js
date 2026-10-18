"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const [users] = await queryInterface.sequelize.query(
      "SELECT id FROM users ORDER BY id ASC LIMIT 1",
    );

    if (users.length === 0) {
      throw new Error("Create a user before seeding projects.");
    }

    const userId = users[0].id;
    const now = new Date();

    const projects = [
      {
        name: "Gestion des employés",
        description: "Projet de gestion des employés et de leurs informations.",
        start_date: "2026-01-01",
        end_date: "2026-03-31",
        status: "completed",
      },
      {
        name: "Plateforme e-commerce",
        description: "Développement d'une plateforme de vente en ligne.",
        start_date: "2026-04-01",
        end_date: "2026-12-31",
        status: "in_progress",
      },
      {
        name: "Application mobile",
        description: "Création d'une application mobile pour les clients.",
        start_date: "2026-11-01",
        end_date: "2027-03-31",
        status: "planned",
      },
      {
        name: "Refonte du site web",
        description: "Amélioration du design et des performances du site.",
        start_date: "2026-05-01",
        end_date: "2026-10-31",
        status: "in_progress",
      },
      {
        name: "Migration de la base de données",
        description: "Migration et optimisation de la base de données.",
        start_date: "2027-01-01",
        end_date: "2027-02-28",
        status: "planned",
      },
    ];

    const [existingProjects] = await queryInterface.sequelize.query(
      "SELECT name FROM projects",
    );

    const existingNames = new Set(
      existingProjects.map((project) => project.name),
    );

    const missingProjects = projects
      .filter((project) => !existingNames.has(project.name))
      .map((project) => ({
        ...project,
        created_by: userId,
        created_at: now,
        updated_at: now,
      }));

    if (missingProjects.length > 0) {
      await queryInterface.bulkInsert("projects", missingProjects);
    }

    console.log(`${missingProjects.length} new projects inserted.`);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("projects", {
      name: [
        "Gestion des employés",
        "Plateforme e-commerce",
        "Application mobile",
        "Refonte du site web",
        "Migration de la base de données",
      ],
    });
  },
};
