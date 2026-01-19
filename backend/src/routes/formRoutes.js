const express = require("express");
const router = express.Router();
const formController = require("../controllers/formController");

// CREATE FORM
router.post("/", formController.createReport);

// FETCH LAST MOULD COUNTER
router.get("/last-mould-counter", formController.getLastMouldCounter);

module.exports = router;
