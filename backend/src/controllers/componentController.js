const { sql } = require("../config/db");

exports.getComponents = async (req, res) => {
  try {
    const result = await sql.query(
      "SELECT code, description FROM Component"
    );
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch components" });
  }
};
