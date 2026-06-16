const express = require("express");
const router = express.Router();
const {register,logon,logoff}=require("../controllers/userController");
const jwtMiddleware = require("../middleware/jwtMiddleware");
router.route("/register").post(register);
router.route("/logon").post(logon);
router.use(jwtMiddleware);
router.route("/logoff").post(logoff);
module.exports=router;
