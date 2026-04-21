const express = require("express");
const router = express.Router();
const { ValidationError, NotFoundError } = require('../errors');
const dogs = require("../dogData");
router.post("/adopt", (req, res) => {
    const { name, email, dogName } = req.body;

    // ValidationError
    if (!name || !email || !dogName) {
        throw new ValidationError("Missing required fields");
    }

    // Find dog
    const dog = dogs.find(d => d.name === dogName);

    // NotFoundError if missing or unavailable
    if (!dog || dog.status !== "available") {
        throw new NotFoundError("Dog not found or not available");
    }

    return res.status(201).json({
        message: `Adoption request received. We will contact you at ${email} for further details.`,
        requestId: req.requestId
    });
});