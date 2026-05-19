const express = require("express");
const app = express();
const prisma =require("./db/prisma")



// Middleware imports
const userRouter = require("./routes/userRoutes");
const taskRouter = require("./routes/taskRoutes");
const authMiddleware = require("./middleware/auth");
const notFound = require("./middleware/not-found");
const errorHandler = require("./middleware/error-handler");
const analyticsRoutes=require("./routes/analyticsRoutes")
global.user_id = null;
global.users = [];
global.tasks = [];


// Logger middleware
app.use((req, res, next) => {
  console.log(
    `request method is: ${req.method}, path: ${req.path}, Query:`,
    req.query
  );
  next();
});

app.use(express.json({ limit: "1kb" }));

// Routes
app.use("/api/users", userRouter);
app.use("/api/tasks", authMiddleware, taskRouter);
app.use("/api/analytics", authMiddleware, analyticsRoutes)
// Test routes
app.get("/", (req, res) => {
  res.status(200).json({ message: "GET success" });
});

app.post("/testpost", (req, res) => {
  res.status(200).json({ message: "POST success" });
});

// Health check
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', db: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'error', db: 'not connected', error: err.message });
  }
});

// 404 handler
app.use(notFound);


app.use(errorHandler);

// Server start
const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.log(`Server is listening on port ${port}...`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${port} is already in use.`);
  } else {
    console.error("Server error:", err);
  }
  process.exit(1);
});

//  shutdown
let isShuttingDown = false;

async function shutdown(code = 0) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log("Shutting down gracefully...");

  try {
    await new Promise((resolve) => server.close(resolve));
    console.log("HTTP server closed.");

    await prisma.$disconnect();
    console.log("Prisma disconnected");
  } catch (err) {
    console.error("Error during shutdown:", err);
    code = 1;
  } finally {
    process.exit(code);
  }
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
  shutdown(1);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection:", reason);
  shutdown(1);
});

// Export for tests
module.exports = { app, server };