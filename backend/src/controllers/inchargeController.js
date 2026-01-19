const { sql } = require("../config/db");

exports.getIncharges = async (req, res) => {
  try {
    const result = await sql.query(
      "SELECT id, name FROM Incharge"
    );
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch incharges" });
  }
};
