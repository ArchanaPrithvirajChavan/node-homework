const { StatusCodes } = require("http-status-codes");
const crypto = require("crypto");
const util = require("util");
const { userSchema } = require("../validation/userSchema");
const scrypt = util.promisify(crypto.scrypt);

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = await scrypt(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

async function comparePassword(inputPassword, storedHash) {
  const [salt, key] = storedHash.split(":");
  const keyBuffer = Buffer.from(key, "hex");
  const derivedKey = await scrypt(inputPassword, salt, 64);
  return crypto.timingSafeEqual(keyBuffer, derivedKey);
}

async function register(req, res) {
    if (!global.users) global.users = [];
    //if req body exists
    if(!req.body){
        return res.status(StatusCodes.BAD_REQUEST).json({message:"request body is required"})
    }
    //validate user input
    const {error,value}=userSchema.validate(req.body,{abortEarly:false})
 if (error){
    return res.status(StatusCodes.BAD_REQUEST).json({
        message:error.message
    })
 }
 //hash pasword before saving req.body
 const hashedPassword=await hashPassword(value.password);

    const newUser = { ...value,password:hashedPassword};

    global.users.push(newUser);
    global.user_id = newUser.email;
    //remove password before res
    const {password, ...sanitizeUser} =newUser
    return res.status(StatusCodes.CREATED).json({
        message: "User registered successfully",
        user: sanitizeUser
    });
}

async function logon(req, res) {
  //if request body exists
  if (!req.body) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: "Request body is required",
    });
  }

  const users = global.users || [];

  // Find user by email first
  const user = users.find((u) => u.email === req.body.email);

  // If email not found
  if (!user) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      message: "wrong userid or password",
    });
  }

  //  Compare entered password with stored hashed password
  const passwordMatch = await comparePassword(
    req.body.password,
    user.password
  );

  // If password is correct
  if (passwordMatch) {
    global.user_id = user.email;

    return res.status(StatusCodes.OK).json({
      name: user.name,
    });
  }

  //  Password incorrect
  return res.status(StatusCodes.UNAUTHORIZED).json({
    message: "wrong userid or password",
  });
}

function logoff(req, res) {
    global.user_id = null;

    return res.status(200).json({
        message: "Logged off successfully"
    });
}

module.exports = { register, logon, logoff,hashPassword,comparePassword};