const { sql } = require("../config/db");

exports.getDelayReasons = async (req, res) => {
  try {
    const result = await sql.query`
      SELECT 
        id,
        reasonName
      FROM DelaysReason
      ORDER BY reasonName
    `;

    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Error fetching delay reasons:", error);
    res.status(500).json({ error: "Failed to fetch delay reasons" });
  }
};
