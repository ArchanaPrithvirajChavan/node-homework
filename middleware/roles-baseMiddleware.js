const prisma = require("../db/prisma");

async function requireManager(req, res, next) {
  console.log("JWT User ID:", req.user?.id);
  console.log("Route ID:", req.params.id);

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
  });

  console.log("DB User:", user);

  if (!user) {
    return res.status(404).json({
      message: "User not found",
    });
  }

  console.log("Roles:", user.roles);

  if (!user.roles?.includes("manager")) {
    return res.status(403).json({
      message: "Access denied. Manager role required.",
    });
  }

  next();
}

module.exports = requireManager;