const { sql } = require("../config/db");

// ==========================================
//              DROPDOWN DATA
// ==========================================
exports.getComponents = async (req, res) => {
  try {
    const result = await sql.query("SELECT code, description FROM Component");
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch components" });
  }
};

exports.getDelayReasons = async (req, res) => {
  try {
    const result = await sql.query`SELECT id, reasonName FROM DelaysReason ORDER BY reasonName`;
    res.status(200).json(result.recordset);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch delay reasons" });
  }
};

exports.getEmployees = async (req, res) => {
  try {
    const result = await sql.query("SELECT id, name FROM Employee");
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch employees" });
  }
};

exports.getIncharges = async (req, res) => {
  try {
    const result = await sql.query("SELECT id, name FROM Incharge");
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch incharges" });
  }
};

exports.getSupervisors = async (req, res) => {
  try {
    const result = await sql.query`SELECT id, supervisorName FROM Supervisors ORDER BY supervisorName`;
    res.status(200).json(result.recordset);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch supervisors" });
  }
};

exports.getOperators = async (req, res) => {
  try {
    const result = await sql.query`SELECT id, operatorName FROM Operators ORDER BY operatorName`;
    res.status(200).json(result.recordset);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch operators" });
  }
};

// ==========================================
//            UPDATED: Last Mould Counter
// ==========================================
exports.getLastMouldCounter = async (req, res) => {
  try {
    // UPDATED: JOIN with DisamaticProduction
    const result = await sql.query`
      SELECT TOP 1 p.mouldCounterNo 
      FROM DisamaticProduction p
      JOIN DisamaticProductReport r ON p.reportId = r.id
      ORDER BY r.reportDate DESC, p.mouldCounterNo DESC
    `;

    const lastMouldCounter = result.recordset[0]?.mouldCounterNo || 0;
    res.status(200).json({ lastMouldCounter });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch last mould counter" });
  }
};

// ==========================================
//            UPDATED: Form Submission
// ==========================================

exports.createReport = async (req, res) => {
  const {
    // Report Fields (Parent)
    disa, date, shift, incharge, member1, member2, 
    ppOperator, // <--- NEW FIELD ADDED HERE
    supervisorName, maintenance, significantEvent,
    // Production Array (Children)
    productions = [], 
    // Other Arrays
    nextShiftPlans = [], mouldHardness = [], patternTemps = [], delays = []
  } = req.body;

  try {
    // 1. INSERT MAIN REPORT (Parent Table)
    const reportResult = await sql.query`
      INSERT INTO DisamaticProductReport (
        disa, reportDate, shift, incharge,
        member1, member2,
        ppOperator,  -- <--- NEW COLUMN
        supervisorName,
        maintenance,
        significantEvent
      )
      OUTPUT INSERTED.id
      VALUES (
        ${disa}, ${date}, ${shift}, ${incharge},
        ${member1}, ${member2},
        ${ppOperator || null}, -- <--- NEW VALUE
        ${supervisorName || null},
        ${maintenance || null},
        ${significantEvent || null}
      )
    `;

    const reportId = reportResult.recordset[0].id;

    // ... (The rest of your code for productions, delays, nextShiftPlans, etc. remains exactly the same) ...
    // 2. INSERT PRODUCTIONS
    if (productions.length > 0) {
      for (let p of productions) {
        await sql.query`
          INSERT INTO DisamaticProduction (
            reportId, componentName, mouldCounterNo, produced, poured,
            cycleTime, mouldsPerHour, remarks
          )
          VALUES (
            ${reportId}, ${p.componentName}, ${Number(p.mouldCounterNo)},
            ${Number(p.produced)}, ${Number(p.poured)},
            ${Number(p.cycleTime)}, ${Number(p.mouldsPerHour)},
            ${p.remarks || null}
          )
        `;
      }
    }

    // 3. INSERT DELAYS
    if (delays.length > 0) {
      for (let d of delays) {
        const durationTime = `${d.startTime} - ${d.endTime}`;
        await sql.query`
          INSERT INTO DisamaticDelays (
            reportId, delay, durationMinutes, durationTime
          )
          VALUES (
            ${reportId}, ${d.delayType}, ${Number(d.duration)}, ${durationTime}
          )
        `;
      }
    }

    // 4. INSERT NEXT SHIFT PLANS
    const shiftOrder = ["I", "II", "III"];
    let currentShiftIndex = shiftOrder.indexOf(shift);
    let planDate = new Date(date);

    for (let i = 0; i < nextShiftPlans.length; i++) {
      currentShiftIndex++;
      if (currentShiftIndex >= shiftOrder.length) {
        currentShiftIndex = 0;
        planDate.setDate(planDate.getDate() + 1);
      }
      const planShift = shiftOrder[currentShiftIndex];
      const formattedPlanDate = planDate.toISOString().split("T")[0];
      const plan = nextShiftPlans[i];

      await sql.query`
        INSERT INTO DisamaticNextShiftPlan (
          reportId, planDate, planShift, componentName, plannedMoulds, remarks
        )
        VALUES (
          ${reportId}, ${formattedPlanDate}, ${planShift}, 
          ${plan.componentName}, ${Number(plan.plannedMoulds)}, ${plan.remarks || null}
        )
      `;
    }

    // 5. INSERT MOULD HARDNESS
    for (let i = 0; i < mouldHardness.length; i++) {
      const h = mouldHardness[i];
      await sql.query`
        INSERT INTO DisamaticMouldHardness (
          reportId, componentName, penetrationPP, penetrationSP, bScalePP, bScaleSP, remarks
        )
        VALUES (
          ${reportId}, ${h.componentName}, 
          ${Number(h.penetrationPP)}, ${Number(h.penetrationSP)}, 
          ${Number(h.bScalePP)}, ${Number(h.bScaleSP)}, 
          ${h.remarks || null}
        )
      `;
    }

    // 6. INSERT PATTERN TEMP
    for (let i = 0; i < patternTemps.length; i++) {
      const pt = patternTemps[i];
      await sql.query`
        INSERT INTO DisamaticPatternTemp (
          reportId, componentName, pp, sp, remarks
        )
        VALUES (
          ${reportId}, ${pt.componentName}, 
          ${Number(pt.pp)}, ${Number(pt.sp)}, 
          ${pt.remarks || null}
        )
      `;
    }

    res.status(201).json({ message: "Report saved successfully" });

  } catch (error) {
    console.error("Error saving report:", error);
    res.status(500).json({ error: "Failed to save report", details: error.message });
  }
};