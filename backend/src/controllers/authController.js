const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/user");

//register

const register = async (req, res) => {
  try {
    const { full_name, email, password } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({
        message: "Name,email,password are required",
      });
    }
    const existUser = await User.findOne({
      where: { email },
      attributes: { exclude: ["password"] },
    });
    if (existUser) {
      return res.status(409).json({
        message: "User already exists",
      });
    }
    const hashedPassowrd = await bcrypt.hash(password, 10);

    const user = await User.create({
      full_name,
      email,
      password: hashedPassowrd,
      role: "EMPLOYEE",
    });

    const { password: savedPassword, ...userWitoutPassword } = user.toJSON;

    return res.status(201).json({
      message: "Account created successfully",
      user: userWitoutPassword,
    });
  } catch (error) {
    console.error("Auth error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

//login

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid user or password",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    const { password: savedPassword, ...userWithoutPassword } = user.toJSON();

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid user or password",
      });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is missing from .env");
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "1h" },
    );
    return res.status(200).json({
      message: "login Successs",
      token,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = { register, login };
