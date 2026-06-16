function requireManager(req,res,next){
    const roles=req.user?.roles;
    if(!roles ||!roles.includes("manager")){
        return res.status(401).json({
            message:"Access denied. Manager role required.",
        })
    }
    next();
}
module.exports=requireManager;