const requireAdmin = (req, res, next) => {
  console.log("req.user =", req.user);

  if (!req.user || req.user.role !== "ADMIN") {
    return res.status(403).json({ message: "Forbidden" });
  }

  next();
};

module.exports = requireAdmin;
