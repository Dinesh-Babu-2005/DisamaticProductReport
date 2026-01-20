const express = require("express");
const router = express.Router();
const formController = require("../controllers/formController");

// --- Dropdown Data Routes ---
router.get("/components", formController.getComponents);
router.get("/delays", formController.getDelayReasons);
router.get("/employees", formController.getEmployees);
router.get("/incharges", formController.getIncharges);
router.get("/supervisors", formController.getSupervisors);

// --- Form Transaction Routes ---
router.get("/forms/last-mould-counter", formController.getLastMouldCounter);
router.post("/forms", formController.createReport);

module.exports = router;