const prisma = require("../db/prisma");
const bcrypt = require("bcrypt");
const { randomUUID } = require("crypto"); //Generates a unique random string.
const jwt = require("jsonwebtoken");

const cookieFlags = () => {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", 
    sameSite: "Strict",
  };
};

const setJwtCookie = (req, res, user) => {

  const payload = { id: user.id, csrfToken: randomUUID() };
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" }); 

  res.cookie("jwt", token, { ...cookieFlags(req), maxAge: 3600000 }); 
  return payload.csrfToken; 
};

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
    priority: "medium",
    userId: newUser.id,
  },
  {
    title: "Add your first task",
    priority: "high",
    userId: newUser.id,
  },
  {
    title: "Explore the app",
    priority: "low",
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
 
   const csrfToken = setJwtCookie(req, res, result.user);

return res.status(201).json({
  user: result.user,
  welcomeTasks: result.welcomeTasks,
  csrfToken,
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

   const csrfToken = setJwtCookie(req, res, user);
console.log("SIGN SECRET:", process.env.JWT_SECRET);
return res.status(200).json({

  id: user.id,
  name: user.name,
  email: user.email,
  csrfToken,
});
  } catch (err) {
    return next(err);
  }
}

// ---------------- LOGOFF ----------------
function logoff(req, res) {
 res.clearCookie("jwt", cookieFlags(req));

return res.status(200).json({
  message: "Logged off successfully",
});
}

module.exports = {
  register,
  logon,
  logoff,
};