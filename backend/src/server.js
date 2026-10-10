const express = require("express");
const sequelize = require("./config/config");

const app = express();

app.use(express.json());

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connected! ✅");

    app.listen(3000, () => {
      console.log("Server running on port 3000 ✅");
    });
  } catch (error) {
    console.error("Database connection failed:", error.message);
  }
};

startServer();
