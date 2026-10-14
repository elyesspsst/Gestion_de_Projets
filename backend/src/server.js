require("dotenv").config();

const path = require("path"); // this line was missing

const express = require("express");
const sequelize = require("./config/config");
const authRoutes = require("./routes/authRoutes");
const profilRoutes = require("./routes/userRoutes");
const employeeRoutes = require("./routes/employeesRoutes");

const app = express();

app.use(express.json());

app.use(
  "/uploads",
  express.static(path.join(__dirname, "../uploads"), {
    setHeaders: (res) => res.setHeader("X-Content-Type-Options", "nosniff"),
  }),
);

app.use("/api/auth", authRoutes);
app.use("/api/profil", profilRoutes);
app.use("/api/employees", employeeRoutes);

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connected! ✅");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT} ✅`);
    });
  } catch (error) {
    console.error("Database connection failed:", error.message);
  }
};

startServer();
