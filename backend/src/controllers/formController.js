const { sql } = require("../config/db");
const PDFDocument = require("pdfkit");

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

// ==========================================
//           DOWNLOAD PDF REPORT
// ==========================================
// ==========================================
//           DOWNLOAD PDF REPORT
// ==========================================
exports.downloadAllReports = async (req, res) => {
  try {
    const reportResult = await sql.query`
      SELECT * FROM DisamaticProductReport 
      ORDER BY reportDate DESC, id DESC
    `;
    const reports = reportResult.recordset;

    if (reports.length === 0) {
      return res.status(404).json({ message: "No reports found" });
    }

    const doc = new PDFDocument({ margin: 30, size: 'A4', bufferPages: true });
    
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="Disamatic_Report_${new Date().toISOString().split('T')[0]}.pdf"`);

    doc.pipe(res);

    // --- UTILS ---
    const startX = 30;
    const pageBottom = 750; 
    const tableWidth = 535;

    // Helper: Check Page Break
    const checkPageBreak = (neededHeight) => {
      if (doc.y + neededHeight > pageBottom) {
        doc.addPage();
        return true; 
      }
      return false;
    };

    // Helper: Draw Cell with Text Wrapping
    const drawCellText = (text, x, y, w, h, align = 'center', font = 'Helvetica', fontSize = 9) => {
      doc.font(font).fontSize(fontSize);
      const content = text ? text.toString() : "-";
      // Force center if empty/hyphen, otherwise use requested align
      const finalAlign = text ? align : 'center';

      const textHeight = doc.heightOfString(content, { width: w - 4 });
      const topPad = (h - textHeight) / 2; 
      
      doc.text(content, x + 2, y + (topPad > 0 ? topPad : 4), { 
        width: w - 4, 
        align: finalAlign,
      });
    };

    // --- MAIN LOOP ---
    for (let i = 0; i < reports.length; i++) {
      const r = reports[i];
      if (i > 0) doc.addPage(); 

      // 1. HEADER
      let currentY = 30;
      doc.rect(startX, currentY, tableWidth, 60).stroke();
      
      doc.font('Helvetica-Bold').fontSize(14).text("SAKTHI AUTO", startX + 10, currentY + 25, { width: 120, align: 'center' });
      
      // Vertical Separator Line
      doc.moveTo(startX + 130, currentY).lineTo(startX + 130, currentY + 60).stroke();

      doc.fontSize(12).text("DISAMATIC PRODUCT REPORT", startX + 130, currentY + 25, { 
        width: 270, 
        align: 'center' 
      });

      const metaX = 400;
      const metaW = tableWidth - (metaX - startX);
      doc.rect(metaX, currentY, metaW, 60).stroke();
      
      doc.fontSize(9).font('Helvetica');
      doc.text(`Date: ${new Date(r.reportDate).toLocaleDateString()}`, metaX + 5, currentY + 8);
      doc.moveTo(metaX, currentY + 20).lineTo(startX + tableWidth, currentY + 20).stroke();
      doc.text(`Shift: ${r.shift}`, metaX + 5, currentY + 28);
      doc.moveTo(metaX, currentY + 40).lineTo(startX + tableWidth, currentY + 40).stroke();
      doc.text(`Incharge: ${r.incharge}`, metaX + 5, currentY + 48);

      currentY += 70; 

      // 2. MEMBERS & OPERATOR ROW
      const members = [r.member1, r.member2].filter(Boolean).join(", ");
      doc.rect(startX, currentY, tableWidth, 25).stroke();
      doc.font('Helvetica-Bold').text("Members Present:", startX + 5, currentY + 8);
      doc.font('Helvetica').text(members, startX + 90, currentY + 8);
      doc.font('Helvetica-Bold').text("P/P Operator:", startX + 350, currentY + 8);
      doc.font('Helvetica').text(r.ppOperator || "-", startX + 420, currentY + 8);

      currentY += 35;

      // GENERIC TABLE DRAWER
      const drawGenericTable = async (title, columns, dataQuery) => {
        const result = await sql.query(dataQuery);
        const data = result.recordset;

        if (checkPageBreak(40)) currentY = 50;
        doc.font('Helvetica-Bold').fontSize(10).fillColor('black').text(title, startX, currentY);
        currentY += 15;

        const headerHeight = 20;
        let xPos = startX;
        
        doc.rect(startX, currentY, tableWidth, headerHeight).fillColor('#e0e0e0').stroke();
        doc.fillColor('black'); 

        columns.forEach(col => {
          drawCellText(col.label, xPos, currentY - 2, col.w, headerHeight, 'center', 'Helvetica-Bold', 8);
          doc.moveTo(xPos + col.w, currentY).lineTo(xPos + col.w, currentY + headerHeight).stroke();
          xPos += col.w;
        });
        doc.rect(startX, currentY, tableWidth, headerHeight).stroke();
        currentY += headerHeight;

        if (data.length === 0) {
          doc.rect(startX, currentY, tableWidth, 20).stroke();
          drawCellText("- No Data -", startX, currentY, tableWidth, 20);
          currentY += 20;
        } else {
          doc.font('Helvetica').fontSize(9);
          for (const row of data) {
            let maxRowHeight = 20; 
            columns.forEach(col => {
              const text = row[col.key] ? String(row[col.key]) : "-";
              const textHeight = doc.heightOfString(text, { width: col.w - 6 }); 
              if (textHeight + 8 > maxRowHeight) maxRowHeight = textHeight + 8;
            });

            if (checkPageBreak(maxRowHeight)) {
              currentY = 50; 
              doc.moveTo(startX, currentY).lineTo(startX + tableWidth, currentY).stroke();
            }

            let rX = startX;
            columns.forEach(col => {
              const val = row[col.key];
              drawCellText(val, rX, currentY, col.w, maxRowHeight, col.align || 'center');
              doc.rect(rX, currentY, col.w, maxRowHeight).stroke();
              rX += col.w;
            });
            currentY += maxRowHeight;
          }
        }
        currentY += 15;
      };

      // 3. PRODUCTION TABLE
      await drawGenericTable("Production:", [
        { label: "Mould Counter", key: "mouldCounterNo", w: 70 },
        { label: "Component Name", key: "componentName", w: 150, align: 'left' },
        { label: "Produced", key: "produced", w: 50 },
        { label: "Poured", key: "poured", w: 50 },
        { label: "Cycle", key: "cycleTime", w: 40 },
        { label: "M/Hr", key: "mouldsPerHour", w: 40 },
        { label: "Remarks", key: "remarks", w: 135, align: 'left' }
      ], `SELECT * FROM DisamaticProduction WHERE reportId = ${r.id}`);

      // 4. NEXT SHIFT PLAN
      await drawGenericTable("Next Shift Plan:", [
        { label: "Shift", key: "planShift", w: 40 },
        { label: "Component Name", key: "componentName", w: 250, align: 'left' },
        { label: "Planned Moulds", key: "plannedMoulds", w: 90 },
        { label: "Remarks", key: "remarks", w: 155, align: 'left' }
      ], `SELECT * FROM DisamaticNextShiftPlan WHERE reportId = ${r.id}`);

      // 5. DELAYS
      await drawGenericTable("Delays:", [
        { label: "Delay Reason", key: "delay", w: 250, align: 'left' },
        { label: "Duration (Time)", key: "durationTime", w: 150 },
        { label: "Mins", key: "durationMinutes", w: 135 }
      ], `SELECT * FROM DisamaticDelays WHERE reportId = ${r.id}`);

      // 6. MOULD HARDNESS
      if (checkPageBreak(60)) currentY = 50;
      doc.font('Helvetica-Bold').fontSize(10).text("Mould Hardness:", startX, currentY);
      currentY += 15;

      const mhResult = await sql.query`SELECT * FROM DisamaticMouldHardness WHERE reportId = ${r.id}`;
      const mhData = mhResult.recordset;

      const colW_Comp = 140; 
      const colW_Pen = 120;
      const colW_BScale = 110;
      const colW_Rem = 165;
      const hY = currentY;
      
      doc.rect(startX, hY, tableWidth, 30).fillColor('#e0e0e0').stroke();
      doc.fillColor('black');
      
      drawCellText("Component Name", startX, hY, colW_Comp, 30, 'center', 'Helvetica-Bold');
      doc.rect(startX, hY, colW_Comp, 30).stroke();

      // --- FIXED LINE: Removed "hY - 5", used "hY" to place text inside box ---
      drawCellText("Mould Penetration", startX + colW_Comp, hY, colW_Pen, 15, 'center', 'Helvetica-Bold', 8);
      doc.rect(startX + colW_Comp, hY, colW_Pen, 15).stroke(); // Top Box

      // Sub Headers: PP / SP
      drawCellText("PP", startX + colW_Comp, hY + 15, colW_Pen / 2, 15, 'center', 'Helvetica-Bold');
      doc.rect(startX + colW_Comp, hY + 15, colW_Pen / 2, 15).stroke();
      
      drawCellText("SP", startX + colW_Comp + (colW_Pen / 2), hY + 15, colW_Pen / 2, 15, 'center', 'Helvetica-Bold');
      doc.rect(startX + colW_Comp + (colW_Pen / 2), hY + 15, colW_Pen / 2, 15).stroke();

      // B-Scale
      drawCellText("B-Scale", startX + colW_Comp + colW_Pen, hY, colW_BScale, 15, 'center', 'Helvetica-Bold');
      doc.rect(startX + colW_Comp + colW_Pen, hY, colW_BScale, 15).stroke();

      // Sub Headers: PP / SP
      drawCellText("PP", startX + colW_Comp + colW_Pen, hY + 15, colW_BScale / 2, 15, 'center', 'Helvetica-Bold');
      doc.rect(startX + colW_Comp + colW_Pen, hY + 15, colW_BScale / 2, 15).stroke();

      drawCellText("SP", startX + colW_Comp + colW_Pen + (colW_BScale / 2), hY + 15, colW_BScale / 2, 15, 'center', 'Helvetica-Bold');
      doc.rect(startX + colW_Comp + colW_Pen + (colW_BScale / 2), hY + 15, colW_BScale / 2, 15).stroke();

      // Remarks
      drawCellText("Remarks", startX + colW_Comp + colW_Pen + colW_BScale, hY, colW_Rem, 30, 'center', 'Helvetica-Bold');
      doc.rect(startX + colW_Comp + colW_Pen + colW_BScale, hY, colW_Rem, 30).stroke();

      currentY += 30;

      // Data Rows
      if (mhData.length === 0) {
        doc.rect(startX, currentY, tableWidth, 20).stroke();
        drawCellText("- No Data -", startX, currentY, tableWidth, 20);
        currentY += 20;
      } else {
        doc.font('Helvetica').fontSize(9);
        for (const m of mhData) {
          let maxH = 20;
          const textH = doc.heightOfString(m.componentName || "-", { width: colW_Comp - 6 });
          if (textH + 8 > maxH) maxH = textH + 8;

          if (checkPageBreak(maxH)) currentY = 50;

          let x = startX;
          
          drawCellText(m.componentName, x, currentY, colW_Comp, maxH, 'left');
          doc.rect(x, currentY, colW_Comp, maxH).stroke();
          x += colW_Comp;

          drawCellText(m.penetrationPP, x, currentY, colW_Pen/2, maxH);
          doc.rect(x, currentY, colW_Pen/2, maxH).stroke();
          x += colW_Pen/2;

          drawCellText(m.penetrationSP, x, currentY, colW_Pen/2, maxH);
          doc.rect(x, currentY, colW_Pen/2, maxH).stroke();
          x += colW_Pen/2;

          drawCellText(m.bScalePP, x, currentY, colW_BScale/2, maxH);
          doc.rect(x, currentY, colW_BScale/2, maxH).stroke();
          x += colW_BScale/2;

          drawCellText(m.bScaleSP, x, currentY, colW_BScale/2, maxH);
          doc.rect(x, currentY, colW_BScale/2, maxH).stroke();
          x += colW_BScale/2;

          drawCellText(m.remarks, x, currentY, colW_Rem, maxH, 'left');
          doc.rect(x, currentY, colW_Rem, maxH).stroke();

          currentY += maxH;
        }
      }
      currentY += 15;

      // 7. PATTERN TEMP
      await drawGenericTable("Pattern Temperature:", [
        { label: "Item (Component)", key: "componentName", w: 220, align: 'left' },
        { label: "PP", key: "pp", w: 60 },
        { label: "SP", key: "sp", w: 60 },
        { label: "Remarks", key: "remarks", w: 195, align: 'left' }
      ], `SELECT * FROM DisamaticPatternTemp WHERE reportId = ${r.id}`);

      // 8. FOOTER
      if (checkPageBreak(110)) currentY = 50;
      
      doc.rect(startX, currentY, tableWidth, 50).stroke();
      doc.font('Helvetica-Bold').text("Significant Event:", startX + 5, currentY + 5);
      doc.font('Helvetica').text(r.significantEvent || "None", startX + 5, currentY + 18, { width: tableWidth - 10 });
      
      currentY += 55;

      const maintWidth = 350;
      const supWidth = tableWidth - maintWidth;

      doc.rect(startX, currentY, maintWidth, 50).stroke();
      doc.font('Helvetica-Bold').text("Maintenance:", startX + 5, currentY + 5);
      doc.font('Helvetica').text(r.maintenance || "None", startX + 5, currentY + 18, { width: maintWidth - 10 });

      doc.rect(startX + maintWidth, currentY, supWidth, 50).stroke();
      doc.font('Helvetica-Bold').text("Supervisor:", startX + maintWidth + 5, currentY + 5);
      doc.font('Helvetica').text(r.supervisorName || "-", startX + maintWidth + 5, currentY + 18, { width: supWidth - 10 });
    }

    doc.end();

  } catch (error) {
    console.error("PDF Generation Error:", error);
    if (!res.headersSent) res.status(500).json({ error: "Failed to generate PDF" });
  }
};