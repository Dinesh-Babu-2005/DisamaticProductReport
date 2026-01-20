const express = require("express");
const cors = require("cors");

const formRoutes = require("./routes/formRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// Mount all routes under /api
// Examples: 
//   /api/components
//   /api/forms
//   /api/employees
app.use("/api", formRoutes);

module.exports = app;