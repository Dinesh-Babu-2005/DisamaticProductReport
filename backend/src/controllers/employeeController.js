const { sql } = require("../config/db");

exports.getEmployees = async (req, res) => {
  try {
    const result = await sql.query(
      "SELECT id, name FROM Employee"
    );
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch employees" });
  }
};
