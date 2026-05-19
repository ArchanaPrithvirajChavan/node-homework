const express = require("express");
const router = express.Router();

const {
  create,
  show,
  update,
  deleteTask,
  index,
  bulkCreate
} = require("../controllers/taskController");


router.post("/", create);        
router.get("/", index); 
router.post("/bulk",bulkCreate)         
router.get("/:id", show);         
router.patch("/:id", update);     
router.delete("/:id", deleteTask); 


module.exports = router;