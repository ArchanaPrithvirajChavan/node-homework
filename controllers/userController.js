const prisma = require("../db/prisma");
const bcrypt = require("bcrypt");
const userSchema = require("../validation/userSchema").userSchema;
const { randomUUID } = require("crypto"); //Generates a unique random string.
const jwt = require("jsonwebtoken");
const { StatusCodes } = require("http-status-codes");
const { OAuth2Client } = require("google-auth-library");

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID
);

const cookieFlags = (req) => ({  
  httpOnly: true,  
  secure: process.env.NODE_ENV === 'production',  
  domain: process.env.NODE_ENV === 'production' ? req.hostname : undefined,  
  sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',  
});  

const setJwtCookie = (req, res, user) => {

  const payload = { 
                   id: user.id,
                    roles: user.roles || "user", 
                   csrfToken: randomUUID(),
                   
                  };
                  console.log("JWT PAYLOAD:", payload); 

  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" }); 

  res.cookie("jwt", token, { ...cookieFlags(req), maxAge: 3600000 }); 
  return payload.csrfToken; 
};
//GoogleLogon
async function googleLogon(req, res) {
  try {
    const { authorizationCode } = req.body;

    if (!authorizationCode) {
      return res
        .status(400)
        .json({ error: "Authorization code required" });
    }

    const { tokens } =
      await googleClient.getToken(authorizationCode);

    const ticket =
      await googleClient.verifyIdToken({
        idToken: tokens.id_token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

    const payload = ticket.getPayload();

    const email = payload.email;
    const name = payload.name;

    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name,
          hashedPassword: "GOOGLE_OAUTH_USER",
        },
      });
    }

    const csrfToken = randomUUID();

    const jwtToken = jwt.sign(
      {
        id: user.id,
        csrfToken,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.cookie("jwt", jwtToken, {
      httpOnly: true,
      sameSite: "strict",
      secure: false,
    });

    return res.status(200).json({
      name: user.name,
      csrfToken,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Google authentication failed",
    });
  }
}

// ---------------- REGISTER ----------------
async function register(req, res, next) {
  try {
let isPerson = false;

if (req.body.recaptchaToken) {
  try {
    const token = req.body.recaptchaToken;
    const params = new URLSearchParams();

    params.append("secret", process.env.RECAPTCHA_SECRET);
    params.append("response", token);
    params.append("remoteip", req.ip);

    const response = await fetch(
      "https://www.google.com/recaptcha/api/siteverify",
      {
        method: "POST",
        body: params.toString(),
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    if (!response.ok) {
      console.error(
        `reCAPTCHA API returned ${response.status} ${response.statusText}`
      );
    } else {
      const data = await response.json();
      if (data.success) isPerson = true;
    }
  } catch (error) {
    console.error("reCAPTCHA verification error:", error);
  }

  delete req.body.recaptchaToken;
} else if (
  process.env.RECAPTCHA_BYPASS &&
  req.get("X-Recaptcha-Test") === process.env.RECAPTCHA_BYPASS
) {
  isPerson = true;
}

if (!isPerson) {
  return res.status(StatusCodes.BAD_REQUEST).json({
    message: "Bot verification failed. Please complete the reCAPTCHA.",
  });
}
    const { error } = userSchema.validate(req.body, { abortEarly: false });

  if (error) return next(error);
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
           roles: "user",
        },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          roles:true
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
    if (!req.body || !req.body.email || !req.body.password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
     
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
  googleLogon
};