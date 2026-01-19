const express = require("express");
const router = express.Router();
const { getComponents } = require("../controllers/componentController");

router.get("/", getComponents);

module.exports = router;
