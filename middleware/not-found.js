const {StatusCodes}=require("http-status-codes")
const notfoundMiddleware=(req,res)=>{
     return res.status(StatusCodes.NOT_FOUND).json({message:"Route does not exist"});
}
module.exports=notfoundMiddleware