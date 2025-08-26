import { FaSearch } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const EmployeeActions = ({ search, setSearch }: { search: string; setSearch: (val: string) => void }) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
      <div className="flex items-center bg-gray-100 px-3 py-2 rounded w-full md:w-auto">
        <FaSearch className="text-gray-400 mr-2" />
        <input
          type="text"
          placeholder="Search Employee..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent outline-none w-full"
        />
      </div>

      <button
        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        onClick={() => navigate("/employees/add")}
      >
        Add Employee
      </button>

      <button className="border border-gray-300 px-3 py-2 rounded hover:bg-gray-100">
        &#8942;
      </button>
    </div>
  );
};

export default EmployeeActions;
