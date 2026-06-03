const jwt = require("jsonwebtoken");
const { StatusCodes } = require("http-status-codes");

const send401 = (res) => {
  res
    .status(StatusCodes.UNAUTHORIZED)
    .json({ message: "No user is authenticated." });
};

module.exports =  (req, res, next) => {
  const token = req?.cookies?.jwt; //get the jwt token from req cookies 
  if (!token) {
    return send401(res);
  } 
  console.log("VERIFY SECRET:", process.env.JWT_SECRET);
  console.log("COOKIES FROM REQUEST:", req.cookies);
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    
    
    if (err) {
      
      return send401(res);
    }
    req.user = { id: decoded.id }; 
    
    
    if ( ["POST", "PATCH", "PUT", "DELETE", "CONNECT"].includes(req.method)) {
    

      if (req.get("X-CSRF-TOKEN") != decoded.csrfToken) {
        return send401(res);
      }
    }
    next(); // if the token is good
  });
};
