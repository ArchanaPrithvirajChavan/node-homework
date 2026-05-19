const prisma = require("../db/prisma");

async function getUserAnalytics(req, res) {
  try {
    if (!global.user_id) {
      return res.status(401).json({ message: "Login required" });
    }

    const userId = parseInt(req.params.id);

    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const taskStats = await prisma.task.groupBy({
      by: ["isCompleted"],
      where: { userId },
      _count: { id: true },
    });

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
    // ---------------- SEARCH ----------------
    async function searchTasks(req, res) {
  try {
    const searchQuery = req.query.search;

    if (!searchQuery || searchQuery.trim().length < 2) {
      return res.status(400).json({
        error: "Search query must be at least 2 characters long",
      });
    }

    const limit = parseInt(req.query.limit) || 20;

    const searchPattern = `%${searchQuery}%`;
    const exactMatch = searchQuery;
    const startsWith = `${searchQuery}%`;

    const searchResults = await prisma.$queryRaw`
      SELECT 
        t.id,
        t.title,
        t.is_completed as "isCompleted",
        t.priority,
        t.created_at as "createdAt",
        t.user_id as "userId",
        u.name as "user_name"
      FROM tasks t
      JOIN users u ON t.user_id = u.id
      WHERE t.title ILIKE ${searchPattern}
         OR u.name ILIKE ${searchPattern}
      ORDER BY 
        CASE 
          WHEN t.title ILIKE ${exactMatch} THEN 1
          WHEN t.title ILIKE ${startsWith} THEN 2
          WHEN t.title ILIKE ${searchPattern} THEN 3
          ELSE 4
        END,
        t.created_at DESC
      LIMIT ${limit}
    `;

    return res.status(200).json({
      results: searchResults,
      query: searchQuery,
      count: searchResults.length,
    });

  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
}
async function getUsersWithStats(req, res) {
  return res.status(200).json({
    message: "To be implemented based on assignment requirements"
  });
}
module.exports = {
  getUserAnalytics,
  getUsersWithStats,
  searchTasks,
};