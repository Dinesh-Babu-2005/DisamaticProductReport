const express = require("express");
const cors = require("cors");

const formRoutes = require("./routes/formRoutes");
const inchargeRoutes = require("./routes/inchargeRoutes");
const employeeRoutes = require("./routes/employeeRoutes");
const componentRoutes = require("./routes/componentRoutes");
const delayRoutes = require("./routes/delayRoutes");
const supervisorRoutes = require("./routes/supervisorRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/forms", formRoutes);
app.use("/api/incharges", inchargeRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/components", componentRoutes);
app.use("/api/delays", delayRoutes);
app.use("/api/supervisors", supervisorRoutes);


module.exports = app;
