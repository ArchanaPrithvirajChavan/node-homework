const { taskSchema,patchTaskSchema } = require("../validation/taskSchema");

const prisma = require("../db/prisma");

// -------------------- CREATE --------------------

async function create(req, res) {
  if (!req.user.id) {
    return res.status(401).json({ message: "Login required" });
  }

  const { error, value } = taskSchema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    return res.status(400).json({ message: error.message });
  }

  // eslint-disable-next-line no-useless-catch
  try {
    const task = await prisma.task.create({
      data: {
        title: value.title,
        isCompleted: value.isCompleted ?? false,
        priority: value.priority || "medium",
        userId: req.user.id,
      },
      select: {
        id: true,
        title: true,
        isCompleted: true,
        priority: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    const taskResp = Object.assign({}, task, { User: task.user });
    delete taskResp.user;

    return res.status(201).json(taskResp);

  } catch (error) {
    throw error;
  }
}
// -------------------- BULK CREATE --------------------
async function bulkCreate(req, res, next)  {
  if (!req.user.id) {
    return res.status(401).json({ message: "Login required" });
  }

  const { tasks } = req.body;

  if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
    return res.status(400).json({
      error: "Invalid request data. Expected an array of tasks.",
    });
  }

  const validTasks = [];

  for (const task of tasks) {
    const { error, value } = taskSchema.validate(task);

    if (error) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.details,
      });
    }

    validTasks.push({
      title: value.title,
      isCompleted: value.isCompleted ?? false,
      priority: value.priority || "medium",
      userId: req.user.id,
    });
  }

  try {
    const result = await prisma.task.createMany({
      data: validTasks,
    });

    return res.status(201).json({
      message: "success!",
      tasksCreated: result.count,
      totalRequested: validTasks.length,
    });
  } catch (err) {
    return next(err);
  }
};

// -------------------- INDEX --------------------
async function index(req, res) {
  if (!req.user.id) {
    return res.status(401).json({ message: "Login required" });
  }

  const getOrderBy = (query) => {
    const validSortFields = [
      "title",
      "priority",
      "createdAt",
      "id",
      "isCompleted",
    ];

    const sortBy = query.sortBy || "createdAt";
    const sortDirection = query.sortDirection === "asc" ? "asc" : "desc";

    if (validSortFields.includes(sortBy)) {
      return { [sortBy]: sortDirection };
    }

    return { createdAt: "desc" };
  };

  let page = parseInt(req.query.page) || 1;
  let limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  if (page < 1) {
    return res.status(400).json({
      message: "Page must be greater than or equal to 1",
    });
  }

  if (limit < 1 || limit > 100) {
    return res.status(400).json({
      message: "Limit must be between 1 and 100",
    });
  }

  const whereClause = {
    userId: req.user.id,
  };

  if (req.query.find) {
    whereClause.title = {
      contains: req.query.find,
      mode: "insensitive",
    };
  }

  const tasks = await prisma.task.findMany({
    where: whereClause,
    skip,
    take: limit,
    orderBy: getOrderBy(req.query),
    select: {
      id: true,
      title: true,
      isCompleted: true,
      priority: true,
      createdAt: true,
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  const totalTasks = await prisma.task.count({
    where: whereClause,
  });

  const pagination = {
    page,
    limit,
    total: totalTasks,
    pages: Math.ceil(totalTasks / limit),
    hasNext: page * limit < totalTasks,
    hasPrev: page > 1,
  };


  const tasksResp = tasks.map((t) => {
    const copy = Object.assign({}, t, { User: t.user });
    delete copy.user;
    return copy;
  });

  return res.status(200).json({
    tasks: tasksResp,
    pagination,
  });
}

// -------------------- SHOW --------------------
async function show(req, res) {
  if (!req.user.id) {
    return res.status(401).json({ message: "Login required" });
  }

  const { id } = req.params;

  const task = await prisma.task.findFirst({
    where: {
      id: Number(id),
      userId: req.user.id,
    },
    select: {
      id: true,
      title: true,
      isCompleted: true,
      priority: true,
      createdAt: true,
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  if (!task) {
    return res.status(404).json({ message: "Task not found" });
  }

  
  const taskResp = Object.assign({}, task, { User: task.user });
  delete taskResp.user;

  return res.status(200).json(taskResp);
}

// -------------------- UPDATE --------------------
async function update(req, res, next) {
  if (!req.user.id) {
    return res.status(401).json({ message: "Login required" });
  }

  const { id } = req.params;

  const { error, value } = patchTaskSchema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    return res.status(400).json({ message: error.message });
  }

  const data = {};
  if (value.title !== undefined) data.title = value.title;
  if (value.isCompleted !== undefined) data.isCompleted = value.isCompleted;
  if (value.priority !== undefined) data.priority = value.priority;

  try {
    const updatedTask = await prisma.task.update({
      where: {
        id_userId: {
          id: Number(id),
          userId: req.user.id,
        },
      },
      data,
      select: {
        id: true,
        title: true,
        isCompleted: true,
        priority: true,
        createdAt: true,
      },
    });

    return res.status(200).json(updatedTask);
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ message: "The task was not found." });
    }
    return next(err);
  }
}


// -------------------- DELETE --------------------
async function deleteTask(req, res, next) {
  if (!req.user.id) {
    return res.status(401).json({ message: "Login required" });
  }

  const { id } = req.params;

  try {
    const deletedTask = await prisma.task.delete({
      where: {
        id_userId: {
          id: Number(id),
          userId: req.user.id,
        },
      },
      select: {
        id: true,
        title: true,
      },
    });

    return res.status(200).json(deletedTask);
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ message: "Task not found" });
    }
    return next(err);
  }
}

module.exports = {
  create,
  bulkCreate:bulkCreate,
  index,
  show,
  update,
  deleteTask,
};