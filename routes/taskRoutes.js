const express = require("express");
const router = express.Router();

const {
  create,
  show,
  update,
  deleteTask,
  index
} = require("../controllers/taskController");

router.post("/create", create);
// router.get("/index", index);
router.get("/show/:id", show);
router.put("/update/:id", update);
router.delete("/delete/:id", deleteTask);
router.get("/index/:id",index)

module.exports = router;