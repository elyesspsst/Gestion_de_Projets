const bcrypt = require("bcrypt");
const fs = require("fs");
const path = require("path");
const sequelize = require("../config/config");
const { User, Employee } = require("../models/association");

const PHOTO_DIR = path.join(__dirname, "../../uploads/profile_pictures");
const PHOTO_URL_PREFIX = "/uploads/profile_pictures/";
const MIN_PASSWORD_LENGTH = 8;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Deletes a file we stored. Ignores anything that is not one of our own photos.
const removePhotoFile = (storedValue) => {
  if (!storedValue || !storedValue.startsWith(PHOTO_URL_PREFIX)) return;
  const file = path.join(PHOTO_DIR, path.basename(storedValue));
  fs.unlink(file, (err) => {
    if (err && err.code !== "ENOENT") {
      console.error("Could not delete photo:", err);
    }
  });
};

// Returns the user's employee row, creating an empty one if it doesn't exist yet
const getOrCreateEmployee = (user, t) =>
  user.employee || user.createEmployee({}, { transaction: t });

// Single source of truth for the profile shape (used by GET and PUT responses)
const fetchProfile = (userId) =>
  User.findByPk(userId, {
    attributes: { exclude: ["password"] },
    include: [
      {
        model: Employee,
        as: "employee",
        attributes: ["profile_picture", "phone"],
        required: false,
      },
    ],
  });

// Returns an error message string, or null if the body is valid
const validateBody = (body) => {
  if (body.full_name !== undefined && !String(body.full_name).trim()) {
    return "Full name cannot be empty";
  }
  if (
    body.email !== undefined &&
    !EMAIL_REGEX.test(String(body.email).trim())
  ) {
    return "Invalid email address";
  }
  if (
    body.password !== undefined &&
    String(body.password).length < MIN_PASSWORD_LENGTH
  ) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  }
  return null;
};

const getProfile = async (req, res) => {
  try {
    const user = await fetchProfile(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "Profile retrieved successfully",
      user,
    });
  } catch (error) {
    console.error("Profile error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

const updateProfile = async (req, res) => {
  const body = req.body || {};
  const newPhoto = req.file ? PHOTO_URL_PREFIX + req.file.filename : null;

  try {
    const validationError = validateBody(body);
    if (validationError) {
      removePhotoFile(newPhoto);
      return res.status(400).json({ message: validationError });
    }

    const user = await User.findByPk(req.user.id, {
      include: [{ model: Employee, as: "employee", required: false }],
    });
    if (!user) {
      removePhotoFile(newPhoto);
      return res.status(404).json({ message: "User not found" });
    }

    // Fields of the users table
    const updates = {};
    if (body.full_name !== undefined)
      updates.full_name = String(body.full_name).trim();
    if (body.email !== undefined) updates.email = String(body.email).trim();
    if (body.password !== undefined) {
      updates.password = await bcrypt.hash(String(body.password), 10);
    }

    // Fields of the employees table
    const employeeUpdates = {};
    if (body.phone !== undefined) employeeUpdates.phone = body.phone;
    if (newPhoto) {
      employeeUpdates.profile_picture = newPhoto;
    } else if (body.remove_photo === true || body.remove_photo === "true") {
      employeeUpdates.profile_picture = null;
    }

    let oldPhoto = null;

    await sequelize.transaction(async (t) => {
      if (Object.keys(updates).length > 0) {
        await user.update(updates, { transaction: t });
      }
      if (Object.keys(employeeUpdates).length > 0) {
        const employee = await getOrCreateEmployee(user, t);
        oldPhoto = employee.profile_picture;
        await employee.update(employeeUpdates, { transaction: t });
      }
    });

    // Only after a successful commit do we delete the replaced/removed file
    if ("profile_picture" in employeeUpdates) {
      removePhotoFile(oldPhoto);
    }

    return res.status(200).json({
      message: "Profile updated successfully",
      user: await fetchProfile(user.id),
    });
  } catch (error) {
    removePhotoFile(newPhoto); // don't keep an orphan file

    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({ message: "This email is already in use" });
    }
    console.error("Update profile error:", error);
    return res.status(500).json({ message: "Error updating profile" });
  }
};

module.exports = { getProfile, updateProfile };
