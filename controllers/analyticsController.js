const prisma = require("../db/prisma");
async function users(req, res) {
  try {
    if (!global.user_id) {
      return res.status(401).json({ message: "Login required" });
    }
    const userId = parseInt(req.params.id);

    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    // Task stats
    const taskStats = await prisma.task.groupBy({
      by: ["isCompleted"],
      where: { userId },
      _count: { id: true },
    });

    // Recent tasks
    const recentTasks = await prisma.task.findMany({
      where: { userId },
      select: {
        id: true,
        title: true,
        isCompleted: true,
        priority: true,
        createdAt: true,
        User: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // Weekly progress
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const weeklyProgress = await prisma.task.groupBy({
      by: ["createdAt"],
      where: {
        userId,
        createdAt: { gte: oneWeekAgo },
      },
      _count: { id: true },
    });

    return res.status(200).json({
      taskStats,
      recentTasks,
      weeklyProgress,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
}

module.exports = { users };