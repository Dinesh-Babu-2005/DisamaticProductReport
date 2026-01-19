const express = require("express");
const router = express.Router();
const supervisorController = require("../controllers/supervisorController");

// GET ALL SUPERVISORS
router.get("/", supervisorController.getSupervisors);

module.exports = router;
