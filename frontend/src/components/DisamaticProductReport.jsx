import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const SearchableSelect = ({ label, options, displayKey, onSelect, required }) => {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = options.filter((item) =>
    item[displayKey]?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative">
      <label className="font-medium">{label}</label>

      <input
        type="text"
        required={required}
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        className="w-full border p-2 rounded"
        placeholder={`Search ${label}`}
      />

      {open && (
        <ul className="absolute z-10 bg-white border w-full max-h-40 overflow-y-auto rounded shadow">
          {filtered.length > 0 ? (
            filtered.map((item, index) => (
              <li
                key={index}
                onClick={() => {
                  setSearch(item[displayKey]);
                  setOpen(false);
                  onSelect(item);
                }}
                className="p-2 hover:bg-gray-100 cursor-pointer"
              >
                {item[displayKey]}
              </li>
            ))
          ) : (
            <li className="p-2 text-gray-500">No results found</li>
          )}
        </ul>
      )}
    </div>
  );
};


const DisamaticProductReport = () => {
  // 1. Defined Initial States for easy resetting
  const initialFormState = {
    disa: "",
    date: "",
    shift: "",
    incharge: "",
    member1: "",
    member2: "",
    ppOperator: "", 
    significantEvent: "",
    maintenance: "",
    supervisorName: "",
  };

  // ... existing formData state (keep only general fields like date, shift, incharge, etc.)

  // NEW: State for multiple production entries
  const [productions, setProductions] = useState([
    {
      componentName: "",
      mouldCounterNo: "",
      produced: 0,
      poured: "",
      cycleTime: "",
      mouldsPerHour: "",
      remarks: ""
    }
  ]);

  const [formData, setFormData] = useState(initialFormState);

  // 2. Add a Reset Key to force SearchableSelects to clear visually
  const [resetKey, setResetKey] = useState(0);

  const [incharges, setIncharges] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [operators, setOperators] = useState([]);
  const [components, setComponents] = useState([]);
  const [previousMouldCounter, setPreviousMouldCounter] = useState(0);
  
  const [nextShiftPlans, setNextShiftPlans] = useState([
    { componentName: "", plannedMoulds: "", remarks: "" },
  ]);
  
  const [delays, setDelays] = useState([
    { delayType: "", startTime: "", endTime: "", duration: 0 },
  ]);
  
  const [delaysMaster, setDelaysMaster] = useState([]);
  
  const [mouldHardness, setMouldHardness] = useState([
    { componentName: "", penetrationPP: "", penetrationSP: "", bScalePP: "", bScaleSP: "", remarks: "" },
  ]);
  
  const [patternTemps, setPatternTemps] = useState([
    { componentName: "", pp: "", sp: "", remarks: "" },
  ]);
  
  const [supervisors, setSupervisors] = useState([]);


  // --- API Calls ---
  useEffect(() => {
    const fetchLastCounter = async () => {
      try {
        const res = await axios.get(
          "http://localhost:5000/api/forms/last-mould-counter"
        );
        const lastValue = Number(res.data.lastMouldCounter) || 0;
        setPreviousMouldCounter(lastValue);
        setFormData((prev) => ({ ...prev, mouldCounterNo: lastValue }));
      } catch (err) {
        console.error("Failed to fetch last mould counter", err);
      }
    };
    fetchLastCounter();
  }, []);

  useEffect(() => {
    axios.get("http://localhost:5000/api/delays").then((res) => setDelaysMaster(res.data));
    axios.get("http://localhost:5000/api/incharges").then((res) => setIncharges(res.data));
    axios.get("http://localhost:5000/api/employees").then((res) => setEmployees(res.data));
    axios.get("http://localhost:5000/api/operators").then((res) => setOperators(res.data));
    axios.get("http://localhost:5000/api/components").then((res) => setComponents(res.data));
    axios.get("http://localhost:5000/api/supervisors").then((res) => setSupervisors(res.data));
  }, []);

  // --- Handlers ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "mouldCounterNo") {
      const current = Number(value);
      if (isNaN(current) || current < 0 || current > 600000) return;
      const produced = Math.max(0, current - previousMouldCounter);
      setFormData((prev) => ({ ...prev, mouldCounterNo: current, produced }));
      return;
    }
    const numericFields = ["poured", "cycleTime"];
    setFormData((prev) => ({
      ...prev,
      [name]: numericFields.includes(name) ? Number(value) : value,
    }));
  };

  // Next Shift Plan Handlers
  const addNextShiftPlan = () => {
    setNextShiftPlans([...nextShiftPlans, { componentName: "", plannedMoulds: "", remarks: "" }]);
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

  // Delay Handlers
  const addDelay = () => {
    setDelays([...delays, { delayType: "", startTime: "", endTime: "", duration: 0 }]);
  };
  const removeDelay = (index) => {
    setDelays(delays.filter((_, i) => i !== index));
  };
  const updateDelay = (index, field, value) => {
    const updated = [...delays];
    updated[index][field] = value;
    if (updated[index].startTime && updated[index].endTime) {
      const start = new Date(`1970-01-01T${updated[index].startTime}`);
      const end = new Date(`1970-01-01T${updated[index].endTime}`);
      let diff = (end - start) / 60000; 
      if (diff < 0) diff += 1440;
      updated[index].duration = Math.round(diff);
    } else {
      updated[index].duration = 0;
    }
    setDelays(updated);
  };

  // Mould Hardness Handlers
  const addMouldHardness = () => {
    setMouldHardness([...mouldHardness, { componentName: "", penetrationPP: "", penetrationSP: "", bScalePP: "", bScaleSP: "", remarks: "" }]);
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

  // Pattern Temp Handlers
  const addPatternTemp = () => {
    setPatternTemps([...patternTemps, { componentName: "", pp: "", sp: "", remarks: "" }]);
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

  // --- PRODUCTION HANDLERS ---
  const addProduction = () => {
    setProductions([
      ...productions,
      { componentName: "", mouldCounterNo: "", produced: 0, poured: "", cycleTime: "", mouldsPerHour: "", remarks: "" }
    ]);
  };

  const removeProduction = (index) => {
    if (productions.length === 1) return;
    const updated = productions.filter((_, i) => i !== index);
    // Recalculate produced values for the remaining list to keep math correct
    recalculateChain(updated);
  };

  const updateProduction = (index, field, value) => {
      const updated = [...productions];
      
      if (field === "mouldCounterNo") {
        updated[index][field] = value;
        // Trigger recalculation of the whole chain when a counter changes
        recalculateChain(updated);
      } 
      else if (field === "poured" || field === "cycleTime") {
        updated[index][field] = value;
        
        // Calculate Moulds Per Hour
        const p = field === "poured" ? Number(value) : Number(updated[index].poured);
        const c = field === "cycleTime" ? Number(value) : Number(updated[index].cycleTime);
        
        if (p && c) {
          // CHANGED: Use Math.round() to get a whole number instead of .toFixed(2)
          updated[index].mouldsPerHour = Math.round((p * c) / 3600);
        }
        
        setProductions(updated);
      } 
      else {
        updated[index][field] = value;
        setProductions(updated);
      }
    };

  // Helper: Recalculates 'produced' for every row based on the previous row's counter
  const recalculateChain = (list) => {
    let prev = previousMouldCounter; // Start with the fetched DB counter
    const newList = list.map((item) => {
      const current = Number(item.mouldCounterNo) || 0;
      // Produced = Current Counter - Previous Counter (min 0)
      const produced = current ? Math.max(0, current - prev) : 0;
      if (current) prev = current; // Update 'prev' for the next iteration
      return { ...item, produced };
    });
    setProductions(newList);
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Send 'productions' array instead of individual fields
      await axios.post("http://localhost:5000/api/forms", {
        ...formData,
        productions, 
        delays,
        nextShiftPlans,
        mouldHardness,
        patternTemps,
      });

      // 1. Update previous counter to match what we just submitted
      const lastItem = productions[productions.length - 1];
      const newPreviousCounter = lastItem.mouldCounterNo 
        ? Number(lastItem.mouldCounterNo) 
        : previousMouldCounter;
        
      setPreviousMouldCounter(newPreviousCounter);

      // 2. Reset Main Form Data (keeping mouldCounterNo synced to new previous)
      setFormData(initialFormState);

      // 3. Reset All Arrays
      setProductions([{ 
        componentName: "", 
        mouldCounterNo: "", 
        produced: 0, 
        poured: "", 
        cycleTime: "", 
        mouldsPerHour: "", 
        remarks: "" 
      }]);
      setNextShiftPlans([{ componentName: "", plannedMoulds: "", remarks: "" }]);
      setDelays([{ delayType: "", startTime: "", endTime: "", duration: 0 }]);
      setMouldHardness([{ componentName: "", penetrationPP: "", penetrationSP: "", bScalePP: "", bScaleSP: "", remarks: "" }]);
      setPatternTemps([{ componentName: "", pp: "", sp: "", remarks: "" }]);

      // 4. Update Reset Key -> This forces SearchableSelects to re-render and clear their text
      setResetKey((prev) => prev + 1);

      toast.success("Report submitted and form cleared");
    } catch (err) {
      console.error(err);
      toast.error("Submission failed");
    }
  };

  return (
    <div>
      <ToastContainer position="top-right" autoClose={3000} theme="colored" />
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
            <select
              name="disa"
              required
              value={formData.disa}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            >
              <option value="">Select</option>
              <option value="I">I</option>
              <option value="II">II</option>
              <option value="III">III</option>
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="font-medium">Date</label>
            <input
              type="date"
              name="date"
              required
              value={formData.date}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            />
          </div>

          {/* Shift */}
          <div>
            <label className="font-medium">Shift</label>
            <select
              name="shift"
              required
              value={formData.shift}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            >
              <option value="">Select</option>
              <option value="I">I</option>
              <option value="II">II</option>
              <option value="III">III</option>
            </select>
          </div>

          {/* Incharge */}
          <div>
            <SearchableSelect
              key={`incharge-${resetKey}`}
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
                key={`member1-${resetKey}`}
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
                key={`member2-${resetKey}`}
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

          {/* P/P Operator */}
          <div className="mt-4">
            <SearchableSelect
              key={`ppOperator-${resetKey}`}
              label="P/P Operator"
              options={operators}
              displayKey="operatorName"
              required
              onSelect={(item) =>
                setFormData({ ...formData, ppOperator: item.operatorName })
              }
            />
          </div>

{/* ================= PRODUCTION SECTION ================= */}
          <div className="mt-6 border-t pt-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-blue-800">Production :</h2>
              <button 
                type="button" 
                onClick={addProduction} 
                className="bg-blue-600 text-white font-bold px-3 py-1 rounded hover:bg-blue-700"
              >
                + Add Row
              </button>
            </div>

            {productions.map((prod, index) => (
              <div key={index} className="border border-blue-200 rounded-lg p-4 mb-4 bg-blue-50 relative">
                {/* Remove Button (only if more than 1 row) */}
                {productions.length > 1 && (
                  <button 
                    type="button" 
                    onClick={() => removeProduction(index)} 
                    className="absolute top-2 right-2 text-red-600 font-bold hover:text-red-800"
                  >
                    ✕
                  </button>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Row 1 */}
                  <SearchableSelect 
                    // Use a unique key combining index and resetKey to force clear on submit
                    key={`prod-comp-${index}-${resetKey}`} 
                    label="Component Name" 
                    options={components} 
                    displayKey="description" 
                    required 
                    onSelect={(item) => updateProduction(index, "componentName", item.description)} 
                  />
                  
                  <div>
                    <label className="font-medium text-sm">Mould Counter No.</label>
                    <input 
                      type="number" 
                      required 
                      value={prod.mouldCounterNo} 
                      onChange={(e) => updateProduction(index, "mouldCounterNo", e.target.value)}
                      className="w-full border p-2 rounded" 
                    />
                  </div>

                  {/* Row 2 */}
                  <div>
                    <label className="font-medium text-sm">Produced (Calc)</label>
                    <input 
                      type="number" 
                      value={prod.produced} 
                      readOnly 
                      className="w-full border p-2 rounded bg-gray-200 cursor-not-allowed" 
                    />
                  </div>
                  <div>
                    <label className="font-medium text-sm">Poured</label>
                    <input 
                      type="number" 
                      required 
                      value={prod.poured} 
                      onChange={(e) => updateProduction(index, "poured", e.target.value)}
                      className="w-full border p-2 rounded" 
                    />
                  </div>

                  {/* Row 3 */}
                  <div>
                    <label className="font-medium text-sm">Cycle Time</label>
                    <input 
                      type="number" 
                      required 
                      value={prod.cycleTime} 
                      onChange={(e) => updateProduction(index, "cycleTime", e.target.value)}
                      className="w-full border p-2 rounded" 
                    />
                  </div>
                  <div>
                    <label className="font-medium text-sm">Moulds Per Hour</label>
                    <input 
                      type="number" 
                      value={prod.mouldsPerHour} 
                      readOnly 
                      className="w-full border p-2 rounded bg-gray-200 cursor-not-allowed" 
                    />
                  </div>
                  
                  {/* Row 4 */}
                  <div className="md:col-span-2">
                    <label className="font-medium text-sm">Remarks</label>
                    <textarea 
                      value={prod.remarks} 
                      onChange={(e) => updateProduction(index, "remarks", e.target.value)} 
                      className="w-full border p-2 rounded h-16"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Next Shift Plan Section */}
          <div className="mt-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Next Shift Plan :</h2>
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

                <SearchableSelect
                  key={`nextPlan-${index}-${resetKey}`}
                  label="Component Name"
                  options={components}
                  displayKey="description"
                  required
                  onSelect={(item) =>
                    updateNextShiftPlan(index, "componentName", item.description)
                  }
                />

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

                <SearchableSelect
                  key={`delay-${index}-${resetKey}`}
                  label="Delay"
                  options={delaysMaster}
                  displayKey="reasonName"
                  required
                  onSelect={(item) =>
                    updateDelay(index, "delayType", item.reasonName)
                  }
                />

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

                <SearchableSelect
                  key={`hardness-${index}-${resetKey}`}
                  label="Component Name"
                  options={components}
                  displayKey="description"
                  required
                  onSelect={(comp) =>
                    updateMouldHardness(index, "componentName", comp.description)
                  }
                />

                <h3 className="font-semibold mt-2">
                  Mould Penetration Tester (N/cm²)
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="font-medium">PP *</label>
                    <input
                      type="number"
                      min={20}
                      step="0.01"  // <--- ALLOWS DECIMALS
                      required
                      value={item.penetrationPP}
                      onChange={(e) =>
                        updateMouldHardness(index, "penetrationPP", e.target.value)
                      }
                      className="w-full border p-2 rounded"
                    />
                  </div>
                  <div>
                    <label className="font-medium">SP *</label>
                    <input
                      type="number"
                      min={20}
                      step="0.01"  // <--- ALLOWS DECIMALS
                      required
                      value={item.penetrationSP}
                      onChange={(e) =>
                        updateMouldHardness(index, "penetrationSP", e.target.value)
                      }
                      className="w-full border p-2 rounded"
                    />
                  </div>
                </div>

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
              <h2 className="text-lg font-semibold">Pattern Temp. (°C) :</h2>
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

                <SearchableSelect
                  key={`patternTemp-${index}-${resetKey}`}
                  label="Item (Component)"
                  options={components}
                  displayKey="description"
                  required
                  onSelect={(item) =>
                    updatePatternTemp(index, "componentName", item.description)
                  }
                />

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
            <div>
              <label className="font-medium">Significant Event</label>
              <textarea
                name="significantEvent"
                value={formData.significantEvent}
                onChange={handleChange}
                className="w-full border p-2 rounded"
                placeholder="Enter any significant event..."
              />
            </div>

            <div className="mt-4">
              <label className="font-medium">Maintenance</label>
              <textarea
                name="maintenance"
                value={formData.maintenance}
                onChange={handleChange}
                className="w-full border p-2 rounded"
                placeholder="Enter maintenance details..."
              />
            </div>

            <div className="mt-4">
              <SearchableSelect
                key={`supervisor-${resetKey}`}
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

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            Submit Report
          </button>
        </form>
      </div>
    </div>
  );
};

export default DisamaticProductReport;