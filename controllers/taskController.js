const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");

global.tasks = global.tasks || [];

const taskCounter = (() => {
  let lastTaskNumber = 0;
  return () => ++lastTaskNumber;
})();

// -------------------- CREATE --------------------
function create(req, res) {
  if (!global.user_id) {
    return res.status(401).json({ message: "Login required" });
  }

  if (!req.body) {
    return res.status(400).json({ message: "Request body is required" });
  }

  const { error, value } = taskSchema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    return res.status(400).json({ message: error.message });
  }

  const newTask = {
    ...value,
    id: taskCounter(),
    userId: global.user_id,
  };

  global.tasks.push(newTask);

  const { userId, ...sanitizedTask } = newTask;

  return res.status(201).json(sanitizedTask);
}

// -------------------- INDEX --------------------
function index(req, res) {
  if (!global.user_id) {
    return res.status(401).json({ message: "Login required" });
  }

  const userTasks = global.tasks.filter(
    (t) => t.userId === global.user_id
  );

  if (userTasks.length === 0) {
    return res.status(404).json([]);
  }

  const sanitized = userTasks.map(({ userId, ...rest }) => rest);

  return res.status(200).json(sanitized);
}

// -------------------- UPDATE --------------------
function update(req, res) {
  if (!global.user_id) {
    return res.status(401).json({ message: "Login required" });
  }

  const index = global.tasks.findIndex(
    (t) => t.id === Number(req.params.id)
  );

  if (index === -1) {
    return res.status(404).json({ message: "Task not found" });
  }

  if (global.tasks[index].userId !== global.user_id) {
    return res.status(403).json({ message: "Forbidden" });
  }

  
  const { error, value } = patchTaskSchema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    return res.status(400).json({ message: error.message });
  }

  global.tasks[index] = {
    ...global.tasks[index],
    ...value,
  };

  const { userId, ...sanitized } = global.tasks[index];

  return res.status(200).json(sanitized);
}

// -------------------- DELETE --------------------
function deleteTask(req, res) {
  if (!global.user_id) {
    return res.status(401).json({ message: "Login required" });
  }

  const taskId = Number(req.params.id);

  const index = global.tasks.findIndex((t) => t.id === taskId);

  if (index === -1) {
    return res.status(404).json({ message: "Task not found" });
  }

  if (global.tasks[index].userId !== global.user_id) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const deletedTask = global.tasks[index];

  global.tasks.splice(index, 1);

  const { userId, ...sanitized } = deletedTask;

  return res.status(200).json(sanitized);
}

// -------------------- SHOW --------------------
function show(req, res) {
  if (!global.user_id) {
    return res.status(401).json({ message: "Login required" });
  }

  const task = global.tasks.find(
    (t) =>
      t.id === Number(req.params.id) &&
      t.userId === global.user_id
  );

  if (!task) {
    return res.status(404).json({ message: "Task not found" });
  }

  const { userId, ...sanitizedTask } = task;

  return res.status(200).json(sanitizedTask);
}

module.exports = {
  create,
  update,
  deleteTask,
  show,
  index,
};