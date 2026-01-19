import { useState } from "react";

const SearchableSelect = ({ label, options, displayKey, onSelect, required }) => {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = options.filter((item) =>
    item[displayKey].toLowerCase().includes(search.toLowerCase())
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
          {filtered.map((item, index) => (
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
          ))}
        </ul>
      )}
    </div>
  );
};

export default SearchableSelect;
