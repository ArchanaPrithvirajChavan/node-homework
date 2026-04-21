const express = require("express");
const router = express.Router();
const dogs = require("../dogData"); 
const { ValidationError, NotFoundError } = require('../errors');

router.get("/dogs", (req, res) => {
    res.status(200).json(dogs);
});

router.post("/adopt", (req, res) => {
    const { name, email, dogName } = req.body;


// Throw a ValidationError
if (!name || !email || !dogName) {
  throw new ValidationError("Missing required fields");
}

// Throw a NotFoundError
if (!dogs || dogs.status !== "available") {
  throw new NotFoundError("Dog not found or not available");
}

    
    const dogExists = dogs.some(d => d.name === dogName);

    if (!dogExists) {
        console.warn("WARN: NotFoundError");

        return res.status(404).json({
            error: "Dog not found or not available",
            requestId: req.requestId
        });
    }

    
    return res.status(201).json({
        message: `Adoption request received. We will contact you at ${email} for further details.`,
        requestId: req.requestId
    });
});

module.exports = router;