function checkAuth(req, res, next) {
  if (!global.user_id) {
    return res.status(401).json({ message: "Login required" });
  }
  next();
}

module.exports = checkAuth;