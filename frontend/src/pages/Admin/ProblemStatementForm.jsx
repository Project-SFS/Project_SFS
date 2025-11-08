import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/common/Button";
import { addProblemStatement, getEvaluatorUsers } from "../../mockData";
import { FiSearch, FiSave, FiX } from "react-icons/fi";

const ProblemStatementForm = ({ isCreate }) => {
  const navigate = useNavigate();
  const evaluators = getEvaluatorUsers();

  const [formData, setFormData] = useState({
    id: "",
    title: "",
    description: "",
    youtube: "",
    dataset: "",
  });

  const [assignedEvaluators, setAssignedEvaluators] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showPopup, setShowPopup] = useState(false);

  // Example data for popup list
  const problemStatements = [
    { id: "IC10001", title: "AI-powered Traffic Control System" },
    { id: "IC10002", title: "Blockchain Voting App" },
    { id: "IC10003", title: "Smart Agriculture Drone" },
    { id: "IC10004", title: "IoT-based Waste Management" },
    { id: "IC10005", title: "Virtual Healthcare Assistant" },
  ];

  // Show popup automatically when user types
  useEffect(() => {
    if (searchTerm.trim() !== "") {
      setShowPopup(true);
    } else {
      setShowPopup(false);
    }
  }, [searchTerm]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isCreate) addProblemStatement({ ...formData, assignedEvaluators });
    alert(`${isCreate ? "Created" : "Updated"} problem statement successfully!`);
    navigate("/admin/problems");
  };

  const handleCancel = () => navigate("/admin/problems");

  // Filtered list
  const filteredProblems = problemStatements.filter(
    (p) =>
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F7F8FC] p-6 relative">
      {/* ---------- Top Search Bar ---------- */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#1A202C]">
            {isCreate ? "Create Problem Statement" : "Edit Problem Statement"}
          </h1>
          <p className="text-sm text-[#718096]">
            Search existing statements or create a new one.
          </p>
        </div>

        <div className="mt-4 md:mt-0 flex gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search Problem Statements"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border border-gray-300 rounded-full py-2 px-4 text-sm w-64 focus:ring-2 focus:ring-[#FF9900]/30 focus:outline-none"
            />
            <FiSearch className="absolute right-3 top-2.5 text-gray-400" />
          </div>
        </div>
      </div>

      {/* ---------- Problem Statement Popup ---------- */}
      {showPopup && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-[90%] max-w-3xl p-6 relative animate-fadeIn">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-[#1A202C]">
                Problem Statement List
              </h2>
              <button
                onClick={() => setShowPopup(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <div className="overflow-x-auto border rounded-xl border-gray-200">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-[#FFFAF0] text-[#1A202C]">
                  <tr>
                    <th className="p-3 font-semibold border-b">ID</th>
                    <th className="p-3 font-semibold border-b">Title</th>
                    <th className="p-3 font-semibold border-b text-center">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProblems.length > 0 ? (
                    filteredProblems.map((p) => (
                      <tr
                        key={p.id}
                        className="hover:bg-[#FFF7E6] transition-all duration-150"
                      >
                        <td className="p-3 border-b">{p.id}</td>
                        <td className="p-3 border-b">{p.title}</td>
                        <td className="p-3 border-b text-center">
                          <button
                            onClick={() => {
                              setFormData({
                                ...formData,
                                id: p.id,
                                title: p.title,
                              });
                              setSearchTerm("");
                              setShowPopup(false);
                            }}
                            className="text-[#FF9900] hover:underline font-medium"
                          >
                            Select
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="3"
                        className="text-center p-4 text-gray-500 italic"
                      >
                        No matching problem statements found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ---------- Form Section ---------- */}
      <div className="bg-white shadow-sm rounded-2xl border p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Problem ID */}
          <div>
            <label className="block text-sm font-medium text-[#2D3748] mb-2">
              Problem Statement ID
            </label>
            <input
              type="text"
              name="id"
              value={formData.id}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#FF9900]/20 outline-none"
              placeholder="e.g., IC10001"
            />
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-[#2D3748] mb-2">
              Title
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#FF9900]/20 outline-none"
              placeholder="Enter problem statement title"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-[#2D3748] mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows="4"
              className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#FF9900]/20 outline-none"
              placeholder="Describe the problem statement"
            />
          </div>

          {/* YouTube */}
          <div>
            <label className="block text-sm font-medium text-[#2D3748] mb-2">
              YouTube Link
            </label>
            <input
              type="url"
              name="youtube"
              value={formData.youtube}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#FF9900]/20 outline-none"
              placeholder="https://youtube.com/watch?v=..."
            />
          </div>

          {/* Dataset */}
          <div>
            <label className="block text-sm font-medium text-[#2D3748] mb-2">
              Dataset Link
            </label>
            <input
              type="url"
              name="dataset"
              value={formData.dataset}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#FF9900]/20 outline-none"
              placeholder="https://example.com/dataset"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-4">
            <Button
              type="submit"
              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-xl flex items-center gap-2 shadow-md transition-all"
            >
              <FiSave className="w-4 h-4" />
              <span>{isCreate ? "Create" : "Update"}</span>
            </Button>
            <Button
              type="button"
              onClick={handleCancel}
              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-xl flex items-center gap-2 shadow-md transition-all"
            >
              <FiX className="w-4 h-4" />
              <span>Cancel</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProblemStatementForm;