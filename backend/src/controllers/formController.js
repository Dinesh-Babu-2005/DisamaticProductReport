const { sql } = require("../config/db");


exports.createReport = async (req, res) => {
  const {
    disa,
    date,
    shift,
    incharge,
    member1,
    member2,
    componentName,
    mouldCounterNo,
    produced,
    poured,
    cycleTime,
    mouldsPerHour,
    remarks,
    nextShiftPlans = [],
    mouldHardness = [],
    patternTemps = [],
    supervisorName,
    maintenance,
    significantEvent,
  } = req.body;

  try {
    // ---------- INSERT MAIN REPORT ----------
    const reportResult = await sql.query`
      INSERT INTO DisamaticProductReport (
        disa, reportDate, shift, incharge,
        member1, member2,
        componentName, mouldCounterNo,
        produced, poured,
        cycleTime, mouldsPerHour,
        remarks,
        supervisorName,
        maintenance,
        significantEvent
      )
      OUTPUT INSERTED.id
      VALUES (
        ${disa}, ${date}, ${shift}, ${incharge},
        ${member1}, ${member2},
        ${componentName}, ${Number(mouldCounterNo)},
        ${Number(produced)}, ${Number(poured)},
        ${Number(cycleTime)}, ${Number(mouldsPerHour)},
        ${remarks || null},
        ${supervisorName || null},
        ${maintenance || null},
        ${significantEvent || null}
      )
    `;

    const reportId = reportResult.recordset[0].id;

    // ---------- INSERT DELAYS ----------
    const { delays = [] } = req.body;

    if (delays.length > 0) {
      for (let d of delays) {

        const durationTime = `${d.startTime} - ${d.endTime}`;

        await sql.query`
          INSERT INTO DisamaticDelays (
            reportId,
            delay,
            durationMinutes,
            durationTime
          )
          VALUES (
            ${reportId},
            ${d.delayType},
            ${Number(d.duration)},
            ${durationTime}
          )
        `;
      }
    }


    // ---------- SHIFT SEQUENCE ----------
    const shiftOrder = ["I", "II", "III"];
    let currentShiftIndex = shiftOrder.indexOf(shift);

    let planDate = new Date(date);

    // ---------- INSERT NEXT SHIFT PLANS ----------
    for (let i = 0; i < nextShiftPlans.length; i++) {
      // move to next shift
      currentShiftIndex++;

      // if shift cycles back to I → increment date
      if (currentShiftIndex >= shiftOrder.length) {
        currentShiftIndex = 0;
        planDate.setDate(planDate.getDate() + 1);
      }

      const planShift = shiftOrder[currentShiftIndex];
      const formattedPlanDate = planDate.toISOString().split("T")[0];

      const plan = nextShiftPlans[i];

      await sql.query`
        INSERT INTO DisamaticNextShiftPlan (
          reportId,
          planDate,
          planShift,
          componentName,
          plannedMoulds,
          remarks
        )
        VALUES (
          ${reportId},
          ${formattedPlanDate},
          ${planShift},
          ${plan.componentName},
          ${Number(plan.plannedMoulds)},
          ${plan.remarks || null}
        )
      `;
    }

    // ---------- INSERT MOULD HARDNESS RECORDS ----------
    for (let i = 0; i < mouldHardness.length; i++) {
      const h = mouldHardness[i];

      await sql.query`
        INSERT INTO DisamaticMouldHardness (
          reportId,
          componentName,
          penetrationPP,
          penetrationSP,
          bScalePP,
          bScaleSP,
          remarks
        )
        VALUES (
          ${reportId},
          ${h.componentName},
          ${Number(h.penetrationPP)},
          ${Number(h.penetrationSP)},
          ${Number(h.bScalePP)},
          ${Number(h.bScaleSP)},
          ${h.remarks || null}
        )
      `;
    }

    // ---------- INSERT PATTERN TEMPERATURE ----------
    for (let i = 0; i < patternTemps.length; i++) {
      const pt = patternTemps[i];

      await sql.query`
        INSERT INTO DisamaticPatternTemp (
          reportId,
          componentName,
          pp,
          sp,
          remarks
        )
        VALUES (
          ${reportId},
          ${pt.componentName},
          ${Number(pt.pp)},
          ${Number(pt.sp)},
          ${pt.remarks || null}
        )
      `;
    }


    res.status(201).json({
      message: "Report and all Next Shift Plans saved successfully",
    });

  } catch (error) {
    console.error("Error saving report:", error);
    res.status(500).json({
      error: "Failed to save report",
      details: error.message,
    });
  }
};


exports.getLastMouldCounter = async (req, res) => {
  try {
    const result = await sql.query`
      SELECT TOP 1 mouldCounterNo 
      FROM DisamaticProductReport 
      ORDER BY reportDate DESC, mouldCounterNo DESC
    `;

    const lastMouldCounter = result.recordset[0]?.mouldCounterNo || 0;

    res.status(200).json({ lastMouldCounter });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch last mould counter" });
  }
};


