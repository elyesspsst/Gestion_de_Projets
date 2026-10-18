"use strict";

const bcrypt = require("bcrypt");

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    const transaction = await queryInterface.sequelize.transaction();

    try {
      const employeesData = [
        {
          full_name: "Ahmed Trabelsi",
          email: "ahmed.trabelsi@example.com",
          job_title: "Backend Developer",
          department: "IT",
          phone: "20111223",
        },
        {
          full_name: "Sarra Ben Ali",
          email: "sarra.benali@example.com",
          job_title: "Frontend Developer",
          department: "IT",
          phone: "20111224",
        },
        {
          full_name: "Youssef Mansour",
          email: "youssef.mansour@example.com",
          job_title: "Software Tester",
          department: "QA",
          phone: "20111225",
        },
        {
          full_name: "Mariem Gharbi",
          email: "mariem.gharbi@example.com",
          job_title: "Database Developer",
          department: "IT",
          phone: "20111226",
        },
        {
          full_name: "Amine Jaziri",
          email: "amine.jaziri@example.com",
          job_title: "DevOps Engineer",
          department: "IT",
          phone: "20111227",
        },
        {
          full_name: "Nour Bouazizi",
          email: "nour.bouazizi@example.com",
          job_title: "UI/UX Designer",
          department: "Design",
          phone: "20111228",
        },
        {
          full_name: "Omar Khelifi",
          email: "omar.khelifi@example.com",
          job_title: "Full Stack Developer",
          department: "IT",
          phone: "20111229",
        },
        {
          full_name: "Ines Saidi",
          email: "ines.saidi@example.com",
          job_title: "Business Analyst",
          department: "Analysis",
          phone: "20111230",
        },
      ];

      const [existingUsers] = await queryInterface.sequelize.query(
        `SELECT email FROM users`,
        { transaction },
      );

      const existingEmails = new Set(
        existingUsers.map((user) => user.email.toLowerCase()),
      );

      const missingEmployees = employeesData.filter(
        (employee) => !existingEmails.has(employee.email.toLowerCase()),
      );

      const passwordHash = await bcrypt.hash("Employee123!", 10);

      for (const employee of missingEmployees) {
        const [userResult] = await queryInterface.bulkInsert(
          "users",
          [
            {
              full_name: employee.full_name,
              email: employee.email,
              password: passwordHash,
              role: "EMPLOYEE",
              status: "active",
              created_at: now,
              updated_at: now,
            },
          ],
          {
            returning: ["id"],
            transaction,
          },
        );

        await queryInterface.bulkInsert(
          "employees",
          [
            {
              user_id: userResult.id,
              job_title: employee.job_title,
              department: employee.department,
              profile_picture: null,
              phone: employee.phone,
              created_at: now,
              updated_at: now,
            },
          ],
          { transaction },
        );
      }

      await transaction.commit();

      console.log(`${missingEmployees.length} new employees created.`);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const emails = [
      "ahmed.trabelsi@example.com",
      "sarra.benali@example.com",
      "youssef.mansour@example.com",
      "mariem.gharbi@example.com",
      "amine.jaziri@example.com",
      "nour.bouazizi@example.com",
      "omar.khelifi@example.com",
      "ines.saidi@example.com",
    ];

    const transaction = await queryInterface.sequelize.transaction();

    try {
      const [users] = await queryInterface.sequelize.query(
        "SELECT id FROM users WHERE email IN (:emails)",
        {
          replacements: { emails },
          transaction,
        },
      );

      const userIds = users.map((user) => user.id);

      if (userIds.length > 0) {
        await queryInterface.bulkDelete(
          "employees",
          { user_id: userIds },
          { transaction },
        );

        await queryInterface.bulkDelete(
          "users",
          { id: userIds },
          { transaction },
        );
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
