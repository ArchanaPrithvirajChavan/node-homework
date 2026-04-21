const express = require("express");
const { v4: uuidv4 } = require("uuid");
const path = require("path");

const dogsRouter = require("./routes/dogs");

const app = express();


app.use((req, res, next) => {
    req.requestId = uuidv4();
    res.setHeader("X-Request-Id", req.requestId);
    next();
});



app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}]: ${req.method} ${req.path} (${req.requestId})`);
    next();
});



app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("X-Request-Id", req.requestId);
  
    next();
});
 app.use(express.json({ limit: '1mb' }));

app.use((req, res, next) => {
    if (req.method === "POST" && !req.is("application/json")) {
        return res.status(400).json({
            error: "Content-Type must be application/json",
            requestId: req.requestId
        });
    }
    next();
});

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use("/", dogsRouter);
app.use((err, req, res, next) => {

    if (err.name === "ValidationError") {
        console.warn(`WARN: ${err.name} - ${err.message}`);
        return res.status(400).json({
            error: err.message,
            requestId: req.requestId
        });
    }

    if (err.name === "NotFoundError") {
        console.warn(`WARN: ${err.name} - ${err.message}`);
        return res.status(404).json({
            error: err.message,
            requestId: req.requestId
        });
    }

    if (err.name === "UnauthorizedError") {
        console.warn(`WARN: ${err.name} - ${err.message}`);
        return res.status(401).json({
            error: err.message,
            requestId: req.requestId
        });
    }

    console.error(`ERROR: ${err.name} - ${err.message}`);

    return res.status(500).json({
        error: "Internal Server Error",
        requestId: req.requestId
    });
});
const server = app.listen(3000, () =>
    console.log("Server listening on port 3000")
);

module.exports = server;