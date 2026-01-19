const { sql } = require("../config/db");

exports.getSupervisors = async (req, res) => {
  try {
    const result = await sql.query`
      SELECT id, supervisorName 
      FROM Supervisors
      ORDER BY supervisorName
    `;

    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Error fetching supervisors:", error);
    res.status(500).json({ error: "Failed to fetch supervisors" });
  }
};
