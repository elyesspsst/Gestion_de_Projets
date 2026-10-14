const multer = require("multer");
const path = require("path");
const fs = require("fs");

const UPLOAD_DIR = path.join(__dirname, "../../uploads/profile_pictures");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// The extension comes from the mimetype, never from the original file name
const EXTENSIONS = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) =>
      cb(null, `user-${req.user.id}-${Date.now()}${EXTENSIONS[file.mimetype]}`),
  }),
  limits: { fileSize: 2 * 1024 * 1024, files: 1 }, // 2 MB
  fileFilter: (req, file, cb) => {
    if (!EXTENSIONS[file.mimetype]) {
      const err = new Error("Only JPG, PNG or WebP images are allowed");
      err.code = "INVALID_FILE_TYPE";
      return cb(err);
    }
    cb(null, true);
  },
});

// Turns multer errors into clean JSON responses
const uploadProfilePhoto = (req, res, next) => {
  upload.single("photo")(req, res, (err) => {
    if (!err) return next();

    if (err.code === "LIMIT_FILE_SIZE") {
      return res
        .status(413)
        .json({ message: "Image too large (2 MB maximum)" });
    }
    if (err.code === "INVALID_FILE_TYPE") {
      return res.status(400).json({ message: err.message });
    }
    if (err instanceof multer.MulterError) {
      console.error("Multer error:", err.code, "field:", err.field);
      return res.status(400).json({
        message: `Upload rejected (${err.code})`,
        field: err.field,
      });
    }
    console.error("Upload error:", err);
    return res.status(500).json({ message: "Server error" });
  });
};

module.exports = uploadProfilePhoto;
