const express = require("express");
const router = express.Router();
const delayController = require("../controllers/delayController");

// FETCH ALL DELAY REASONS
router.get("/", delayController.getDelayReasons);

module.exports = router;
