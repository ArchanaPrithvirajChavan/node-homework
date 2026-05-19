const prisma = require("../db/prisma");

// ---------------- GET USER ANALYTICS ----------------
async function getUserAnalytics(req, res) {
  try {
    if (!global.user_id) {
      return res.status(401).json({ message: "Login required" });
    }

    const userId = parseInt(req.params.id);

    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const taskStats = await prisma.task.groupBy({
      by: ["isCompleted"],
      where: { userId },
      _count: {
        id: true,
      },
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
          select: {
            name: true,
          },
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
      _count: {
        id: true,
      },
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

// ---------------- SEARCH TASKS ----------------
async function searchTasks(req, res) {
  try {
    const searchQuery = req.query.q;

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

// ---------------- USERS WITH STATS ----------------
async function getUsersWithStats(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalUsers = await prisma.user.count();

    const users = await prisma.user.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            task: true,
          },
        },
        task: {
          where: {
            isCompleted: false,
          },
          take: 5,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    const formattedUsers = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,

      // IMPORTANT: test expects Task (capital T)
      _count: {
        Task: user._count.task,
      },

      Task: user.task,
    }));

    const totalPages = Math.ceil(totalUsers / limit);

    return res.status(200).json({
      users: formattedUsers,
      pagination: {
        page,
        limit,
        total: totalUsers,
        pages: totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
}

module.exports = {
  getUserAnalytics,
  searchTasks,
  getUsersWithStats,
};