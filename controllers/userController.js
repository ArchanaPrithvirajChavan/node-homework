
//const { response, json } = require("express");
const prisma = require("../db/prisma")
const bcrypt = require("bcrypt");

// ---------------- REGISTER ----------------
async function register(req, res, next) {
  const { name, email, password } = req.body;

 const existingemail=await prisma.user.findUnique({where:
  {email},
 })
 if (existingemail){
   return res.status(400).json({message:"email already exist"})
 }
  const hashedPassword = await bcrypt.hash(password, 10);

 try {
  const result = await prisma.$transaction(async (tx) => {
    // Create user account
    const newUser = await tx.user.create({
      data: { email, name, hashedPassword },
      select: { id: true, email: true, name: true }
    });

    // Create 3 welcome tasks using createMany
    const welcomeTaskData = [
      { title: "Complete your profile", userId: newUser.id, priority: "medium" },
      { title: "Add your first task", userId: newUser.id, priority: "high" },
      { title: "Explore the app", userId: newUser.id, priority: "low" }
    ];
    await tx.task.createMany({ data: welcomeTaskData });

    // Fetch the created tasks to return them
    const welcomeTasks = await tx.task.findMany({
      where: {
        userId: newUser.id,
        title: { in: welcomeTaskData.map(t => t.title) }
      },
      select: {
        id: true,
        title: true,
        isCompleted: true,
        userId: true,
        priority: true
      }
    });

    return { user: newUser, welcomeTasks };
  });

  // Store the user ID globally for session management
  global.user_id = result.user.id;
  
  // Send response with status 201
  res.status(201);
  res.json({
    user: result.user,
    welcomeTasks: result.welcomeTasks,
    transactionStatus: "success"
  });
  return;
} catch (err) {
  if (err.code === "P2002") {
    // send the appropriate error back -- the email was already registered
    return res.status(400).json({ error: "Email already registered" });
  } else {
    return next(err); // the error handler takes care of other errors
  }
}}

// ---------------- LOGON ----------------
async function logon(req, res) {
  let { email, password } = req.body;

  email = email.toLowerCase();

const user = await prisma.user.findUnique({ where: { email }});
                        
  

  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }



  const match = await bcrypt.compare(password, user.hashedPassword);

  if (!match) {
    return res.status(401).json({ message: "Invalid credentials" });
  }
 global.user_id  = user.id;

  return res.status(200).json({
    id: user.id,
    name: user.name,
    email: user.email,
  });
}
async function show(req,res){
   const userId = parseInt(req.params.id);
  
  if (isNaN(userId)) {
    return res.status(400).json({ error: "Invalid user ID" });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      Task: {
        where: { isCompleted: false },
        select: { 
          id: true, 
          title: true, 
          priority: true,
          createdAt: true 
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      }
    }
  });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  res.status(200).json(user);
};
function logoff(req, res) {
  global.user_id = null;
  return res.status(200).json({ message: "Logged off" });
}
module.exports = {
  register,
  logon,
  show,
  logoff,
};