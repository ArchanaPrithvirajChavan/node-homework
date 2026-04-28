function checkAuth (req,res,next){
    if (!global.user_id){
        return res.status(401).json({ message: "Unauthorized User" });
    }
    
        next();
}
module.exports=checkAuth;