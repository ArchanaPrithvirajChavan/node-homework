const { taskSchema } = require("../validation/taskSchema");
//const  pool  = require("../db/pg-pool");
const  prisma  = require("../db/prisma");

// -------------------- CREATE --------------------
async function create(req, res) {
  if (!global.user_id) {
    return res.status(401).json({ message: "Login required" });
  }

  const { error, value } = taskSchema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    return res.status(400).json({ message: error.message });
  }
  
  try {
    
    const task = await prisma.task.create({
      data: {
        title: value.title,
        isCompleted: value.isCompleted || false,
        userId: global.user_id,
      },
      select: {
        id: true,
        title: true,
        isCompleted: true,
      },
    });
    
    return res.status(201).json(task);
    }

   catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
// -------------------- INDEX --------------------
async function index(req, res) {
  if (!global.user_id) {
    return res.status(401).json({ message: "Login required" });
  }

  const tasks = await prisma.task.findMany({
  where: {
    userId: global.user_id, 
  },
  select: { title: true, isCompleted: true, id: true }
});

  
 if (tasks.length === 0) {
    return res.status(404).json({ message: "No tasks found" });
  }

  return res.status(200).json(tasks);
}

// -------------------- SHOW --------------------
async function show(req, res) {
  if (!global.user_id) {
    return res.status(401).json({ message: "Login required" });
  }

  const { id } = req.params;

  const task = await prisma.task.findFirst({
    where: {
      id: Number(id),
      userId: global.user_id,
    },
    select: {
      id: true,
      title: true,
      isCompleted: true,
    },
  });

  if (!task) {
    return res.status(404).json({ message: "Task not found" });
  }

  return res.status(200).json(task);
}

// -------------------- UPDATE --------------------
async function update(req, res, next) {
  if (!global.user_id) {
    return res.status(401).json({ message: "Login required" });
  }

  const { id } = req.params;
  const fields = req.body;

  try {
    // 1. check task exists and belongs to user
    const task = await prisma.task.findFirst({
      where: {
        id: Number(id),
        userId: global.user_id,
      },
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // 2. update task
    const updatedTask = await prisma.task.update({
      where: {
        id: Number(id),
      },
      data: fields,
      select: {
        id: true,
        title: true,
        isCompleted: true,
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
  if (!global.user_id) {
    return res.status(401).json({ message: "Login required" });
  }

  const { id } = req.params;

  try {
    // 1. check if task belongs to user
    const task = await prisma.task.findFirst({
      where: {
        id: Number(id),
        userId: global.user_id,
      },
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // 2. delete task
    const deletedTask = await prisma.task.delete({
      where: {
        id: Number(id),
      },
      select: {
        id: true,
        title: true,
      },
    });

    return res.status(200).json(deletedTask);

  } catch (err) {
    return next(err);
  }
}
module.exports = {
  create,
  update,
  deleteTask,
  show,
  index,
};