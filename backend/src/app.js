const express = require("express");
const cors = require("cors");

const formRoutes = require("./routes/formRoutes");
// ⬇️ 1. Import the new daily performance routes
const dailyPerformanceRoutes = require("./routes/dailyPerformanceRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", formRoutes);
// ⬇️ 2. Tell Express to use the new routes under the "/api" path
app.use("/api", dailyPerformanceRoutes);

module.exports = app;