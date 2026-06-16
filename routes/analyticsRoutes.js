const express = require("express");
const router = express.Router();
const jwtMiddleware = require("../middleware/jwtMiddleware");
const requireManager =require("../middleware/roles-baseMiddleware");
  const {getUserAnalytics,
  getUsersWithStats,
  searchTasks,
} = require("../controllers/analyticsController");
router.use(jwtMiddleware);
router.use(requireManager);
//all routes for manager only
router.get("/users/:id", getUserAnalytics);

router.get("/users", getUsersWithStats);

router.get("/tasks/search", searchTasks);

module.exports = router;