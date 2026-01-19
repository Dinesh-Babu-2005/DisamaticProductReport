const express = require("express");
const router = express.Router();
const { getIncharges } = require("../controllers/inchargeController");

router.get("/", getIncharges);

module.exports = router;
