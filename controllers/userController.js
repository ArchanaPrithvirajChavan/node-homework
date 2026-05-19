const prisma = require("../db/prisma");
const bcrypt = require("bcrypt");

// ---------------- REGISTER ----------------
async function register(req, res, next) {
  try {
    let { name, email, password } = req.body;

    email = email.toLowerCase().trim();

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create user
      const newUser = await tx.user.create({
        data: {
          name,
          email,
          hashedPassword,
        },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
      });

      // 2. Welcome tasks
      const welcomeTasksData = [
        {
          title: "Complete your profile",
          userId: newUser.id,
        },
        {
          title: "Add your first task",
          userId: newUser.id,
        },
        {
          title: "Explore the app",
          userId: newUser.id,
        },
      ];

      await tx.task.createMany({
        data: welcomeTasksData,
      });

      // 3. Fetch created tasks
      const welcomeTasks = await tx.task.findMany({
        where: {
          userId: newUser.id,
          title: {
            in: welcomeTasksData.map((t) => t.title),
          },
        },
        select: {
          id: true,
          title: true,
          isCompleted: true,
        },
      });

      return { user: newUser, welcomeTasks };
    });
 
    global.user_id = result.user.id;

    return res.status(201).json({
      user: result.user,
      welcomeTasks: result.welcomeTasks,
      transactionStatus: "success",
    });
  } catch (err) {
    if (err && err.code === "P2002") {
      return res.status(400).json({
        message: "Email already registered",
      });
    }

  
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// ---------------- LOGON ----------------
async function logon(req, res, next) {
  try {
    let { email, password } = req.body;

    email = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      user.hashedPassword
    );

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    global.user_id = user.id;

    return res.status(200).json({
      id: user.id,
      name: user.name,
      email: user.email,
    });
  } catch (err) {
    return next(err);
  }
}

// ---------------- LOGOFF ----------------
function logoff(req, res) {
  global.user_id = null;

  return res.status(200).json({
    message: "Logged off successfully",
  });
}

module.exports = {
  register,
  logon,
  logoff,
};