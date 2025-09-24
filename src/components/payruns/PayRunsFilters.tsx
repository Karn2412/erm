import React from "react";
import { FaSearch, FaHistory, FaCalendarAlt } from "react-icons/fa";

interface Props {
  selectedMonth: string;
  setSelectedMonth: (v: string) => void;
  payRange: string;
  setPayRange: (v: string) => void;
  search: string;
  setSearch: (v: string) => void;
}

const PayRunsFilters: React.FC<Props> = ({
  selectedMonth,
  setSelectedMonth,
  payRange,
  setPayRange,
  search,
  setSearch,
}) => {
  return (
    <div className="flex items-start justify-between w-full mb-4">
      <div className="flex flex-col gap-3">
        <div className="flex gap-6">
          {/* Month filter */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">
              Select Month
            </label>
            <div className="flex items-center border border-blue-300 rounded-full px-4 py-2 text-sm w-64">
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="flex-1 bg-transparent focus:outline-none cursor-pointer"
              />
            </div>
          </div>

          {/* Pay Range */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">
              Pay Range
            </label>
            <select
              value={payRange}
              onChange={(e) => setPayRange(e.target.value)}
              className="border border-blue-300 rounded-full px-4 py-2 text-sm text-gray-500 w-64 focus:outline-none"
            >
              <option>All</option>
              <option>0 - 1 Lakh</option>
              <option>1 Lakh - 2 Lakh</option>
            </select>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center bg-gray-100 rounded-full px-3 py-2 text-sm w-60 mt-1">
          <FaSearch className="text-red-500 mr-2 text-xs" />
          <input
            type="text"
            placeholder="Search...."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent focus:outline-none"
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 mt-6">
        {/* Current Month Button */}
        <button
          onClick={() => {
            const now = new Date();
            const formatted = now.toISOString().slice(0, 7); // YYYY-MM
            setSelectedMonth(formatted);
          }}
          className="flex items-center bg-green-600 text-white px-4 py-2 rounded-full text-sm"
        >
          Current Month
          <FaCalendarAlt className="ml-1 text-xs" />
        </button>

        {/* Show Past Button */}
        <button
          onClick={() => {
            const [year, month] = selectedMonth.split("-");
            const prevMonth = new Date(Number(year), Number(month) - 2);
            const formatted = prevMonth.toISOString().slice(0, 7);
            setSelectedMonth(formatted);
          }}
          className="flex items-center bg-[#00AEEF] text-white px-4 py-2 rounded-full text-sm"
        >
          Show Past
          <FaHistory className="ml-1 text-xs" />
        </button>
      </div>
    </div>
  );
};

export default PayRunsFilters;
