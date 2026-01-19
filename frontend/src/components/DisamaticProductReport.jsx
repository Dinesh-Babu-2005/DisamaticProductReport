import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useEffect, useState } from "react";
import SearchableSelect from "./SearchableSelect";


const DisamaticProductReport = () => {
  const [formData, setFormData] = useState({
    disa: "",
    date: "",
    shift: "",
    incharge: "",
    member1: "",
    member2: "",
    componentName: "",
    mouldCounterNo: 0,
    produced: 0,
    poured: "",
    cycleTime: "",
    mouldsPerHour: "",
    remarks: "",
    significantEvent: "",
    maintenance: "",
    supervisorName: "",
  });

  const [incharges, setIncharges] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [components, setComponents] = useState([]);
  const [previousMouldCounter, setPreviousMouldCounter] = useState(0);
  const [nextShiftPlans, setNextShiftPlans] = useState([
    {
      componentName: "",
      plannedMoulds: "",
      remarks: "",
    },
  ]);
  const [delays, setDelays] = useState([
    {
      delayType: "",
      startTime: "",
      endTime: "",
      duration: 0,
    },
  ]);
  const [delaysMaster, setDelaysMaster] = useState([]);
  const [mouldHardness, setMouldHardness] = useState([
    {
      componentName: "",
      penetrationPP: "",
      penetrationSP: "",
      bScalePP: "",
      bScaleSP: "",
      remarks: "",
    },
  ]);
  const [patternTemps, setPatternTemps] = useState([
    {
      componentName: "",
      pp: "",
      sp: "",
      remarks: "",
    },
  ]);
  const [supervisors, setSupervisors] = useState([]);



  useEffect(() => {
    const { poured, cycleTime } = formData;

    if (poured && cycleTime) {
      const mouldsPerHour =
        (Number(poured) * Number(cycleTime)) / 3600;

      setFormData((prev) => ({
        ...prev,
        mouldsPerHour: mouldsPerHour.toFixed(2),
      }));
    }
  }, [formData.poured, formData.cycleTime]);


  useEffect(() => {
  const fetchLastCounter = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/forms/last-mould-counter"
      );

      const lastValue = Number(res.data.lastMouldCounter) || 0;

      setPreviousMouldCounter(lastValue);

      // ✅ sync current counter with previous
      setFormData((prev) => ({
        ...prev,
        mouldCounterNo: lastValue,
      }));

    } catch (err) {
      console.error("Failed to fetch last mould counter", err);
    }
  };

  fetchLastCounter();
}, []);

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/delays")
      .then((res) => setDelaysMaster(res.data))
      .catch((err) =>
        console.error("Failed to fetch delay reasons", err)
      );
  }, []);


  useEffect(() => {
    axios.get("http://localhost:5000/api/incharges")
      .then(res => setIncharges(res.data));

    axios.get("http://localhost:5000/api/employees")
      .then(res => setEmployees(res.data));

    axios.get("http://localhost:5000/api/components")
      .then(res => setComponents(res.data));
  }, []);


  useEffect(() => {
    axios.get("http://localhost:5000/api/supervisors")
      .then(res => setSupervisors(res.data))
      .catch(err => console.error("Failed to fetch supervisors", err));
  }, []);



const handleChange = (e) => {
  const { name, value } = e.target;

  if (name === "mouldCounterNo") {
    const current = Number(value);

    if (isNaN(current) || current < 0 || current > 600000) return;

    const produced = Math.max(0, current - previousMouldCounter);

    setFormData((prev) => ({
      ...prev,
      mouldCounterNo: current,
      produced,
    }));

    return;
  }

  const numericFields = ["poured", "cycleTime"];

  setFormData((prev) => ({
    ...prev,
    [name]: numericFields.includes(name) ? Number(value) : value,
  }));
};

const addNextShiftPlan = () => {
  setNextShiftPlans([
    ...nextShiftPlans,
    { componentName: "", plannedMoulds: "", remarks: "" },
  ]);
};

const updateNextShiftPlan = (index, field, value) => {
  const updated = [...nextShiftPlans];
  updated[index][field] = value;
  setNextShiftPlans(updated);
};

const removeNextShiftPlan = (index) => {
  if (nextShiftPlans.length === 1) return;
  setNextShiftPlans(nextShiftPlans.filter((_, i) => i !== index));
};


  const addDelay = () => {
    setDelays([
      ...delays,
      {
        delayType: "",
        startTime: "",
        endTime: "",
        duration: 0,
      },
    ]);
  };

  const removeDelay = (index) => {
    setDelays(delays.filter((_, i) => i !== index));
  };

  const updateDelay = (index, field, value) => {
    const updated = [...delays];
    updated[index][field] = value;

    // Auto calculate duration
    if (updated[index].startTime && updated[index].endTime) {
      const start = new Date(`1970-01-01T${updated[index].startTime}`);
      const end = new Date(`1970-01-01T${updated[index].endTime}`);

      let diff = (end - start) / 60000; // minutes

      if (diff < 0) diff += 1440; // handles overnight case

      updated[index].duration = Math.round(diff);
    } else {
      updated[index].duration = 0;
    }

    setDelays(updated);
  };

  const addMouldHardness = () => {
  setMouldHardness([
    ...mouldHardness,
    {
      componentName: "",
      penetrationPP: "",
      penetrationSP: "",
      bScalePP: "",
      bScaleSP: "",
      remarks: "",
    },
  ]);
};

  const removeMouldHardness = (index) => {
    if (mouldHardness.length === 1) return;
    setMouldHardness(mouldHardness.filter((_, i) => i !== index));
  };

  const updateMouldHardness = (index, field, value) => {
    const updated = [...mouldHardness];
    updated[index][field] = value;
    setMouldHardness(updated);
  };

    const addPatternTemp = () => {
    setPatternTemps([
      ...patternTemps,
      { componentName: "", pp: "", sp: "", remarks: "" },
    ]);
  };

  const updatePatternTemp = (index, field, value) => {
    const updated = [...patternTemps];
    updated[index][field] = value;
    setPatternTemps(updated);
  };

  const removePatternTemp = (index) => {
    if (patternTemps.length === 1) return;
    setPatternTemps(patternTemps.filter((_, i) => i !== index));
  };



  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axios.post("http://localhost:5000/api/forms", {
        ...formData,
        delays,
        nextShiftPlans,
        mouldHardness,
        patternTemps,
      });

      // ✅ Save current counter as previous
      setPreviousMouldCounter(formData.mouldCounterNo);

      setNextShiftPlans([
        { componentName: "", plannedMoulds: "", remarks: "" },
      ]);

      setPatternTemps([
        { componentName: "", pp: "", sp: "", remarks: "" },
      ]);

      toast.success("Report submitted successfully");

    } catch (err) {
      console.error(err);
      toast.error("Submission failed");
    }
  };


  const downloadPDF = () => {
  const doc = new jsPDF("p", "mm", "a4");

  // ============ PAGE 1 - MAIN REPORT ============
  doc.setFontSize(16);
  doc.text("DISAMATIC PRODUCT REPORT", 60, 15);

  doc.setFontSize(10);
  doc.text(`Disa: ${formData.disa}`, 10, 25);
  doc.text(`Date: ${formData.date}`, 10, 30);
  doc.text(`Shift: ${formData.shift}`, 10, 35);
  doc.text(`Incharge: ${formData.incharge}`, 10, 40);

  autoTable(doc, {
    startY: 50,
    head: [["Field", "Value"]],
    body: [
      ["Component", formData.componentName || "-"],
      ["Mould Counter", formData.mouldCounterNo],
      ["Produced", formData.produced],
      ["Poured", formData.poured],
      ["Cycle Time", formData.cycleTime],
      ["Moulds/Hour", formData.mouldsPerHour],
      ["Remarks", formData.remarks || "-"],
    ],
  });

  // ============ NEXT SHIFT PLAN ============
  if (nextShiftPlans.length > 0) {
    doc.addPage();
    doc.text("NEXT SHIFT PLAN", 80, 15);

    autoTable(doc, {
      startY: 25,
      head: [["S.No", "Component", "Planned Moulds", "Remarks"]],
      body: nextShiftPlans.map((p, i) => [
        i + 1,
        p.componentName || "-",
        p.plannedMoulds || "-",
        p.remarks || "-",
      ]),
    });
  }

  // ============ DELAYS ============
  if (delays.length > 0) {
    doc.addPage();
    doc.text("DELAYS", 90, 15);

    autoTable(doc, {
      startY: 25,
      head: [["S.No", "Delay", "Duration (min)", "Time Range"]],
      body: delays.map((d, i) => [
        i + 1,
        d.delayType || "-",
        d.duration || 0,
        d.startTime && d.endTime
          ? `${d.startTime} - ${d.endTime}`
          : "-",
      ]),
    });
  }

  // ============ MOULD HARDNESS ============
  if (mouldHardness.length > 0) {
    doc.addPage();
    doc.text("MOULD HARDNESS", 80, 15);

    autoTable(doc, {
      startY: 25,
      head: [
        [
          "Component",
          "Penetration PP",
          "Penetration SP",
          "B-Scale PP",
          "B-Scale SP",
          "Remarks",
        ],
      ],
      body: mouldHardness.map((m) => [
        m.componentName || "-",
        m.penetrationPP || "-",
        m.penetrationSP || "-",
        m.bScalePP || "-",
        m.bScaleSP || "-",
        m.remarks || "-",
      ]),
    });
  }

  // ============ PATTERN TEMPERATURE ============
  if (patternTemps.length > 0) {
    doc.addPage();
    doc.text("PATTERN TEMPERATURE", 70, 15);

    autoTable(doc, {
      startY: 25,
      head: [["Component", "PP", "SP", "Remarks"]],
      body: patternTemps.map((p) => [
        p.componentName || "-",
        p.pp || "-",
        p.sp || "-",
        p.remarks || "-",
      ]),
    });
  }

  // ============ OTHER DETAILS ============
  doc.addPage();
  doc.text("OTHER DETAILS", 80, 15);

  autoTable(doc, {
    startY: 25,
    head: [["Field", "Value"]],
    body: [
      ["Supervisor", formData.supervisorName || "-"],
      ["Maintenance", formData.maintenance || "-"],
      ["Significant Event", formData.significantEvent || "-"],
    ],
  });

  doc.save(`Disamatic_Report_${formData.date || "Report"}.pdf`);
};


  return (
    <div>
      <ToastContainer
      position="top-right"
      autoClose={3000}
      theme="colored"
    />
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <form
          onSubmit={handleSubmit}
          className="bg-white w-full max-w-3xl rounded-xl shadow-lg p-6 space-y-4"
        >
          <h1 className="text-2xl font-bold text-center">
            DISAMATIC PRODUCT REPORT
          </h1>

          {/* DISA */}
          <div>
            <label className="font-medium">DISA-</label>
            <select name="disa" required onChange={handleChange}
              className="w-full border p-2 rounded">
              <option value="">Select</option>
              <option value="I">I</option>
              <option value="II">II</option>
              <option value="III">III</option>
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="font-medium">Date</label>
            <input type="date" name="date" required
              onChange={handleChange}
              className="w-full border p-2 rounded" />
          </div>

          {/* Shift */}
          <div>
            <label className="font-medium">Shift</label>
            <select name="shift" required onChange={handleChange}
              className="w-full border p-2 rounded">
              <option value="">Select</option>
              <option value="I">I</option>
              <option value="II">II</option>
              <option value="III">III</option>
            </select>
          </div>

          {/* Incharge */}
          <div>
            <SearchableSelect
              label="Incharge"
              options={incharges}
              displayKey="name"
              required
              onSelect={(item) =>
                setFormData({ ...formData, incharge: item.name })
              }
            />

          </div>

          {/* Members */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <SearchableSelect
                label="Member 1"
                options={employees}
                displayKey="name"
                required
                onSelect={(item) =>
                  setFormData({ ...formData, member1: item.name })
                }
              />
            </div>

            <div>
              <SearchableSelect
                label="Member 2"
                options={employees}
                displayKey="name"
                required
                onSelect={(item) =>
                  setFormData({ ...formData, member2: item.name })
                }
              />
            </div>
          </div>

          {/* Production */}
          <h2 className="text-lg font-semibold mt-4">Production :</h2>

          {/* Component + Counter */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-medium">Mould Counter No.</label>
              <input
                type="number"
                name="mouldCounterNo"
                min={0}
                max={600000}
                value={formData.mouldCounterNo}
                required
                onChange={handleChange}
                className="w-full border p-2 rounded"
              />
            </div>

            <div>
              <SearchableSelect
                label="Component Name"
                options={components}
                displayKey="description"
                required
                onSelect={(item) =>
                  setFormData({
                    ...formData,
                    componentName: item.description,
                    componentCode: item.code,
                  })
                }
              />
            </div>

          </div>

          {/* Produced / Poured */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-medium">Produced</label>
              <input
                type="number"
                name="produced"
                value={formData.produced}
                readOnly
                className="w-full border p-2 rounded bg-gray-100 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="font-medium">Poured</label>
              <input type="number" name="poured" required
                onChange={handleChange}
                className="w-full border p-2 rounded" />
            </div>
          </div>

          {/* Cycle Time + Moulds Per Hour */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-medium">Cycle Time</label>
              <input type="number" name="cycleTime" required
                onChange={handleChange}
                className="w-full border p-2 rounded" />
            </div>

            <div>
              <label className="font-medium">Moulds Per Hour</label>
              <input
                type="number"
                name="mouldsPerHour"
                value={formData.mouldsPerHour}
                readOnly
                className="w-full border p-2 rounded bg-gray-100 cursor-not-allowed"
              />
            </div>

          </div>

          {/* Remarks */}
          <div>
            <label className="font-medium">Remarks</label>
            <textarea name="remarks"
              onChange={handleChange}
              className="w-full border p-2 rounded" />
          </div>

          {/* Next Shift Plan Section */}
          <div className="mt-6">

            {/* Title + PLUS BUTTON */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                Next Shift Plan :
              </h2>

              <button
                type="button"
                onClick={addNextShiftPlan}
                className="text-xl font-bold px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700"
              >
                +
              </button>
            </div>

            {nextShiftPlans.map((plan, index) => (
              <div
                key={index}
                className="border rounded-lg p-4 mt-4 space-y-4 bg-gray-50"
              >
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">Plan {index + 1}</h3>

                  {nextShiftPlans.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeNextShiftPlan(index)}
                      className="text-red-600 font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Component */}
                <SearchableSelect
                  label="Component Name"
                  options={components}
                  displayKey="description"
                  required
                  onSelect={(item) =>
                    updateNextShiftPlan(index, "componentName", item.description)
                  }
                />

                {/* Planned Moulds */}
                <div>
                  <label className="font-medium">Planned Moulds *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={plan.plannedMoulds}
                    onChange={(e) =>
                      updateNextShiftPlan(index, "plannedMoulds", e.target.value)
                    }
                    className="w-full border p-2 rounded"
                  />
                </div>

                {/* Remarks */}
                <div>
                  <label className="font-medium">Remarks</label>
                  <textarea
                    value={plan.remarks}
                    onChange={(e) =>
                      updateNextShiftPlan(index, "remarks", e.target.value)
                    }
                    className="w-full border p-2 rounded"
                  />
                </div>
              </div>
            ))}
          </div>


          {/* ================= DELAYS SECTION ================= */}
          <div className="mt-6">

            {/* Title + Add Button */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Delays :</h2>

              <button
                type="button"
                onClick={addDelay}
                className="text-xl font-bold px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700"
              >
                +
              </button>
            </div>

            {delays.map((delay, index) => (
              <div
                key={index}
                className="border rounded-lg p-4 mt-4 space-y-4 bg-gray-50"
              >
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">Delay {index + 1}</h3>

                  {delays.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeDelay(index)}
                      className="text-red-600 font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Delay Type */}
                <SearchableSelect
                  label="Delay"
                  options={delaysMaster}   // ⬅️ your delay master list
                  displayKey="reasonName"
                  required
                  onSelect={(item) =>
                    updateDelay(index, "delayType", item.reasonName)
                  }
                />

                {/* Start & End Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="font-medium">Start Time</label>
                    <input
                      type="time"
                      required
                      value={delay.startTime}
                      onChange={(e) =>
                        updateDelay(index, "startTime", e.target.value)
                      }
                      className="w-full border p-2 rounded"
                    />
                  </div>

                  <div>
                    <label className="font-medium">End Time</label>
                    <input
                      type="time"
                      required
                      value={delay.endTime}
                      onChange={(e) =>
                        updateDelay(index, "endTime", e.target.value)
                      }
                      className="w-full border p-2 rounded"
                    />
                  </div>
                </div>

                {/* Duration */}
                <div>
                  <label className="font-medium">Duration (Minutes)</label>
                  <input
                    type="number"
                    value={delay.duration}
                    readOnly
                    className="w-full border p-2 rounded bg-gray-100 cursor-not-allowed"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* ================= MOULD HARDNESS SECTION ================= */}
          <div className="mt-6">

            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Mould Hardness :</h2>

              <button
                type="button"
                onClick={addMouldHardness}
                className="text-xl font-bold px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700"
              >
                +
              </button>
            </div>

            {mouldHardness.map((item, index) => (
              <div
                key={index}
                className="border rounded-lg p-4 mt-4 space-y-4 bg-gray-50"
              >
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">Mould Hardness {index + 1}</h3>

                  {mouldHardness.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeMouldHardness(index)}
                      className="text-red-600 font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Component Name */}
                <SearchableSelect
                  label="Component Name"
                  options={components}
                  displayKey="description"
                  required
                  onSelect={(comp) =>
                    updateMouldHardness(index, "componentName", comp.description)
                  }
                />

                {/* ---------- Penetration Tester ---------- */}
                <h3 className="font-semibold mt-2">
                  Mould Penetration Tester (N/cm²)
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="font-medium">PP *</label>
                    <input
                      type="number"
                      min={20}
                      required
                      value={item.penetrationPP}
                      onChange={(e) =>
                        updateMouldHardness(
                          index,
                          "penetrationPP",
                          e.target.value
                        )
                      }
                      className="w-full border p-2 rounded"
                    />
                  </div>

                  <div>
                    <label className="font-medium">SP *</label>
                    <input
                      type="number"
                      min={20}
                      required
                      value={item.penetrationSP}
                      onChange={(e) =>
                        updateMouldHardness(
                          index,
                          "penetrationSP",
                          e.target.value
                        )
                      }
                      className="w-full border p-2 rounded"
                    />
                  </div>
                </div>

                {/* ---------- B-Scale ---------- */}
                <h3 className="font-semibold mt-2">B-Scale</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="font-medium">PP *</label>
                    <input
                      type="number"
                      min={85}
                      required
                      value={item.bScalePP}
                      onChange={(e) =>
                        updateMouldHardness(index, "bScalePP", e.target.value)
                      }
                      className="w-full border p-2 rounded"
                    />
                  </div>

                  <div>
                    <label className="font-medium">SP *</label>
                    <input
                      type="number"
                      min={85}
                      required
                      value={item.bScaleSP}
                      onChange={(e) =>
                        updateMouldHardness(index, "bScaleSP", e.target.value)
                      }
                      className="w-full border p-2 rounded"
                    />
                  </div>
                </div>

                {/* Remarks */}
                <div>
                  <label className="font-medium">Remarks</label>
                  <textarea
                    value={item.remarks}
                    onChange={(e) =>
                      updateMouldHardness(index, "remarks", e.target.value)
                    }
                    className="w-full border p-2 rounded"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* ================= PATTERN TEMPERATURE SECTION ================= */}
          <div className="mt-6">

            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                Pattern Temp. (°C) :
              </h2>

              <button
                type="button"
                onClick={addPatternTemp}
                className="text-xl font-bold px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700"
              >
                +
              </button>
            </div>

            {patternTemps.map((pt, index) => (
              <div
                key={index}
                className="border rounded-lg p-4 mt-4 space-y-4 bg-gray-50"
              >
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">Pattern Temp {index + 1}</h3>

                  {patternTemps.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePatternTemp(index)}
                      className="text-red-600 font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Component Name */}
                <SearchableSelect
                  label="Item (Component)"
                  options={components}
                  displayKey="description"
                  required
                  onSelect={(item) =>
                    updatePatternTemp(index, "componentName", item.description)
                  }
                />

                {/* PP and SP */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="font-medium">PP *</label>
                    <input
                      type="number"
                      min={45}
                      required
                      value={pt.pp}
                      onChange={(e) =>
                        updatePatternTemp(index, "pp", e.target.value)
                      }
                      className="w-full border p-2 rounded"
                    />
                  </div>

                  <div>
                    <label className="font-medium">SP *</label>
                    <input
                      type="number"
                      min={45}
                      required
                      value={pt.sp}
                      onChange={(e) =>
                        updatePatternTemp(index, "sp", e.target.value)
                      }
                      className="w-full border p-2 rounded"
                    />
                  </div>
                </div>

                {/* Remarks */}
                <div>
                  <label className="font-medium">Remarks</label>
                  <textarea
                    value={pt.remarks}
                    onChange={(e) =>
                      updatePatternTemp(index, "remarks", e.target.value)
                    }
                    className="w-full border p-2 rounded"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* ================= OTHER DETAILS ================= */}
          <div className="mt-6 border-t pt-6">

            {/* Significant Event */}
            <div>
              <label className="font-medium">Significant Event</label>
              <textarea
                name="significantEvent"
                onChange={handleChange}
                className="w-full border p-2 rounded"
                placeholder="Enter any significant event..."
              />
            </div>

            {/* Maintenance */}
            <div className="mt-4">
              <label className="font-medium">Maintenance</label>
              <textarea
                name="maintenance"
                onChange={handleChange}
                className="w-full border p-2 rounded"
                placeholder="Enter maintenance details..."
              />
            </div>

            {/* Supervisor Name */}
            <div className="mt-4">
              <SearchableSelect
                label="Supervisor Name"
                options={supervisors}
                displayKey="supervisorName"
                required
                onSelect={(item) =>
                  setFormData({ ...formData, supervisorName: item.supervisorName })
                }
              />
            </div>
          </div>

          <button type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
            Submit Report
          </button>

          <button
            type="button"
            onClick={downloadPDF}
            className="bg-blue-600 text-white px-4 py-2 rounded mt-4"
          >
            Download Report (PDF)
          </button>
        </form>
      </div>
    </div>
  );
};

export default DisamaticProductReport;
