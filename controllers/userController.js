
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
  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });
     global.user_id =user.id; 
    return res.status(201).json(user);

  } catch (error) {
    console.log("FULL ERROR:", error);

    return res.status(500).json({
      message: error.message,
    });
  }
}

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

  return res.status(200).json({
    id: user.id,
    name: user.name,
    email: user.email,
  });
}


function logoff(req, res) {
  global.user_id = null;
  return res.status(200).json({ message: "Logged off" });
}

module.exports = {
  register,
  logon,
  logoff,
};