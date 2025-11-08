import React, { useState, useMemo } from "react";
import {
  FiEdit,
  FiTrash2,
  FiPlus,
  FiCheckCircle,
  FiXCircle,
  FiUsers,
  FiClipboard,
  FiX,
} from "react-icons/fi";

const EvaluatorList = () => {
  const [evaluators, setEvaluators] = useState([
    {
      id: "EV1001",
      name: "John Doe",
      email: "john@example.com",
      dept: "CSE",
      status: "active",
      problemStatementId: "PSAI01",
      problemStatement: "AI-Powered assistants",
      completed: 25,
      pending: 5,
      password: "password123", // Added for existing evaluators
    },
    {
      id: "EV1002",
      name: "Jane Smith",
      email: "jane@example.com",
      dept: "ECE",
      status: "inactive",
      problemStatementId: "PSIoT02",
      problemStatement: "IoT sensor networks",
      completed: 42,
      pending: 3,
      password: "password123", // Added
    },
    {
      id: "EV1003",
      name: "Alex Johnson",
      email: "alex.j@example.com",
      dept: "MECH",
      status: "active",
      problemStatementId: "PSRA03",
      problemStatement: "Robotics and Automation",
      completed: 33,
      pending: 7,
      password: "password123", // Added
    },
    {
      id: "EV1004",
      name: "Emily Davis",
      email: "emily.d@example.com",
      dept: "EEE",
      status: "active",
      problemStatementId: "PSPGO04",
      problemStatement: "Power Grid Optimization",
      completed: 29,
      pending: 4,
      password: "password123", // Added
    },
    {
      id: "EV1005",
      name: "Chris Lee",
      email: "chris.lee@example.com",
      dept: "CSE",
      status: "inactive",
      problemStatementId: "PSCS05",
      problemStatement: "Cybersecurity Protocols",
      completed: 50,
      pending: 1,
      password: "password123", // Added
    },
    {
      id: "EV1006",
      name: "Patricia Wilson",
      email: "patricia.w@example.com",
      dept: "ECE",
      status: "active",
      problemStatementId: "PSWC06",
      problemStatement: "Wireless Communication",
      completed: 18,
      pending: 6,
      password: "password123", // Added
    },
    {
      id: "EV1007",
      name: "Michael Brown",
      email: "michael.b@example.com",
      dept: "MECH",
      status: "active",
      problemStatementId: "PSFD07",
      problemStatement: "Fluid Dynamics Simulation",
      completed: 45,
      pending: 2,
      password: "password123", // Added
    },
  ]);

  // State for popups
  const [showCreatePopup, setShowCreatePopup] = useState(false);
  const [showDetailsPopup, setShowDetailsPopup] = useState(null);
  const [showEditPopup, setShowEditPopup] = useState(null);
  const [showProblemStatementPopup, setShowProblemStatementPopup] = useState(false);
  const [toast, setToast] = useState(null);
  const [newEvaluator, setNewEvaluator] = useState({
    name: "",
    email: "",
    dept: "",
    password: "", // Added password to initial state
  });

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const generateId = () => `EV${1000 + evaluators.length + 1}`;

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newEvaluator.name || !newEvaluator.email || !newEvaluator.dept || !newEvaluator.password) {
      showToast("Please fill all fields", "error");
      return;
    }
    const id = generateId();
    const newEval = {
      ...newEvaluator,
      id,
      status: "active",
      problemStatementId: "N/A",
      problemStatement: "Not Assigned",
      completed: 0,
      pending: 0,
    };
    setEvaluators([...evaluators, newEval]);
    setNewEvaluator({ name: "", email: "", dept: "", password: "" }); // Reset password field
    setShowCreatePopup(false);
    showToast("Evaluator created successfully!", "success");
  };

  const handleDelete = (id) => {
    setEvaluators(evaluators.filter((ev) => ev.id !== id));
    showToast("Evaluator deleted successfully!", "success");
  };

  const handleEditSave = (updatedEval) => {
    setEvaluators(
      evaluators.map((ev) => (ev.id === updatedEval.id ? updatedEval : ev))
    );
    setShowEditPopup(null);
    showToast("Evaluator updated successfully!", "success");
  };

  const handleViewDetails = (evaluator) => {
    setShowDetailsPopup(evaluator);
  };

  // Stats Calculations using useMemo for efficiency
  const totalEvaluators = evaluators.length;
  const uniqueProblemStatements = useMemo(() => {
    const problemMap = new Map();
    evaluators.forEach((ev) => {
      if (ev.problemStatementId !== "N/A") {
        problemMap.set(ev.problemStatementId, {
          id: ev.problemStatementId,
          title: ev.problemStatement,
        });
      }
    });
    return Array.from(problemMap.values());
  }, [evaluators]);
  const totalProblemStatements = uniqueProblemStatements.length;

  // Reusable Popup Component
  const Popup = ({ children, visible, onClose }) => (
    <div
      className={`fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <div
        className={`bg-white rounded-2xl shadow-xl p-6 w-[90%] max-w-lg transition-all duration-300 ${
          visible ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
        >
          <FiX size={20} />
        </button>
        {children}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F7F8FC] px-6 py-8 transition-all duration-300">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-[#1A202C] mb-1">
            Evaluator Dashboard
          </h1>
          <p className="text-[#718096] text-sm">
            Manage evaluator profiles and track problem statements.
          </p>
        </div>
        <button
          onClick={() => setShowCreatePopup(true)}
          className="flex items-center gap-2 bg-[#FF9900] hover:bg-[#E68500] text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-all mt-4 sm:mt-0"
        >
          <FiPlus /> Create New Evaluator
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-5 flex items-center gap-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
          <div className="bg-[#FFF4E5] p-4 rounded-xl">
            <FiUsers className="text-[#FF9900] text-2xl" />
          </div>
          <div>
            <p className="text-sm text-[#718096]">Total Evaluators</p>
            <p className="text-2xl font-bold text-[#1A202C]">
              {totalEvaluators}
            </p>
          </div>
        </div>
        <div
          onClick={() => setShowProblemStatementPopup(true)}
          className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-5 flex items-center gap-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer"
        >
          <div className="bg-[#E6FFFA] p-4 rounded-xl">
            <FiClipboard className="text-[#38B2AC] text-2xl" />
          </div>
          <div>
            <p className="text-sm text-[#718096]">Total Problem Statements</p>
            <p className="text-2xl font-bold text-[#1A202C]">
              {totalProblemStatements}
            </p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow-sm rounded-2xl border border-[#E2E8F0] overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-[#F7F8FC] text-[#718096]">
            <tr>
              <th className="text-left py-3 px-5 font-semibold">Evaluator ID</th>
              <th className="text-left py-3 px-5 font-semibold">Name</th>
              <th className="text-left py-3 px-5 font-semibold">Email</th>
              <th className="text-left py-3 px-5 font-semibold">Department</th>
              <th className="text-center py-3 px-5 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {evaluators.map((ev) => (
              <tr
                key={ev.id}
                className="hover:bg-gray-50 border-t border-[#E2E8F0] transition-all"
              >
                <td
                  onClick={() => handleViewDetails(ev)}
                  className="py-4 px-5 font-medium text-[#1A202C] cursor-pointer hover:text-[#FF9900] transition-colors"
                >
                  {ev.id}
                </td>
                <td
                  onClick={() => handleViewDetails(ev)}
                  className="py-4 px-5 cursor-pointer hover:text-[#FF9900] transition-colors"
                >
                  {ev.name}
                </td>
                <td className="py-4 px-5 text-[#718096]">{ev.email}</td>
                <td className="py-4 px-5 text-[#718096]">{ev.dept}</td>
                <td className="py-4 px-5 text-center space-x-4">
                  <button
                    onClick={() => setShowEditPopup(ev)}
                    className="text-gray-500 hover:text-[#FF9900] transition-all"
                  >
                    <FiEdit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(ev.id)}
                    className="text-gray-500 hover:text-red-600 transition-all"
                  >
                    <FiTrash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- POPUPS --- */}

      {/* Create Popup */}
      <Popup visible={showCreatePopup} onClose={() => setShowCreatePopup(false)}>
        <h2 className="text-xl font-semibold text-[#1A202C] mb-5">
          Create New Evaluator
        </h2>
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="text-sm text-[#4A5568] font-medium mb-1 block">
              Evaluator Name
            </label>
            <input
              type="text"
              value={newEvaluator.name}
              onChange={(e) =>
                setNewEvaluator({ ...newEvaluator, name: e.target.value })
              }
              className="w-full px-4 py-2 border border-[#E2E8F0] rounded-xl text-sm focus:ring-2 focus:ring-[#FF9900] focus:outline-none"
              placeholder="Enter name"
            />
          </div>
          <div>
            <label className="text-sm text-[#4A5568] font-medium mb-1 block">
              Email
            </label>
            <input
              type="email"
              value={newEvaluator.email}
              onChange={(e) =>
                setNewEvaluator({ ...newEvaluator, email: e.target.value })
              }
              className="w-full px-4 py-2 border border-[#E2E8F0] rounded-xl text-sm focus:ring-2 focus:ring-[#FF9900] focus:outline-none"
              placeholder="Enter email"
            />
          </div>
          <div>
            <label className="text-sm text-[#4A5568] font-medium mb-1 block">
              Department
            </label>
            <select
              value={newEvaluator.dept}
              onChange={(e) =>
                setNewEvaluator({ ...newEvaluator, dept: e.target.value })
              }
              className="w-full px-4 py-2 border border-[#E2E8F0] rounded-xl text-sm focus:ring-2 focus:ring-[#FF9900] focus:outline-none"
            >
              <option value="">Select Department</option>
              <option value="CSE">Computer Science</option>
              <option value="ECE">Electronics</option>
              <option value="EEE">Electrical</option>
              <option value="MECH">Mechanical</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-[#4A5568] font-medium mb-1 block">
              Password
            </label>
            <input
              type="password" // Important for security
              value={newEvaluator.password}
              onChange={(e) =>
                setNewEvaluator({ ...newEvaluator, password: e.target.value })
              }
              className="w-full px-4 py-2 border border-[#E2E8F0] rounded-xl text-sm focus:ring-2 focus:ring-[#FF9900] focus:outline-none"
              placeholder="Enter password"
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setShowCreatePopup(false)}
              className="px-5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#FF9900] hover:bg-[#E68500] text-white text-sm font-semibold"
            >
              Create
            </button>
          </div>
        </form>
      </Popup>

      {/* Details Popup */}
      {showDetailsPopup && (
        <Popup visible={!!showDetailsPopup} onClose={() => setShowDetailsPopup(null)}>
          <h2 className="text-xl font-semibold text-[#1A202C] mb-5">
            Evaluator Profile
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex">
              <b className="font-semibold text-[#4A5568] w-36">ID:</b>
              <span>{showDetailsPopup.id}</span>
            </div>
            <div className="flex">
              <b className="font-semibold text-[#4A5568] w-36">Name:</b>
              <span>{showDetailsPopup.name}</span>
            </div>
            <div className="flex">
              <b className="font-semibold text-[#4A5568] w-36">Email:</b>
              <span>{showDetailsPopup.email}</span>
            </div>
            <div className="flex">
              <b className="font-semibold text-[#4A5568] w-36">Department:</b>
              <span>{showDetailsPopup.dept}</span>
            </div>
            <div className="flex">
              <b className="font-semibold text-[#4A5568] w-36">Status:</b>
              <span>{showDetailsPopup.status}</span>
            </div>
            <div className="flex items-center">
              <b className="font-semibold text-[#4A5568] w-36">Problem ID:</b>
              {showDetailsPopup.problemStatementId !== "N/A" ? (
                <a
                  href={`/problem-statements/${showDetailsPopup.problemStatementId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {showDetailsPopup.problemStatementId}
                </a>
              ) : (
                <span>N/A</span>
              )}
            </div>
            {/* Password is not displayed here for security */}
          </div>
          <hr className="my-4" />
          <div className="space-y-3 text-sm">
            <div className="flex">
              <b className="font-semibold text-green-600 w-36">Completed:</b>
              <span>{showDetailsPopup.completed} evaluations</span>
            </div>
            <div className="flex">
              <b className="font-semibold text-red-600 w-36">Pending:</b>
              <span>{showDetailsPopup.pending} evaluations</span>
            </div>
          </div>
          <div className="flex justify-end mt-6">
            <button
              onClick={() => setShowDetailsPopup(null)}
              className="px-5 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-semibold"
            >
              Close
            </button>
          </div>
        </Popup>
      )}

      {/* Edit Popup */}
      {showEditPopup && (
        <Popup visible={!!showEditPopup} onClose={() => setShowEditPopup(null)}>
          <h2 className="text-xl font-semibold text-[#1A202C] mb-5">
            Edit Evaluator
          </h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleEditSave(showEditPopup);
            }}
          >
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-3">
              <div>
                <label className="text-sm text-[#4A5568] font-medium mb-1 block">
                  Evaluator ID
                </label>
                <input
                  type="text"
                  value={showEditPopup.id}
                  disabled
                  className="w-full px-4 py-2 border border-[#E2E8F0] rounded-xl text-sm bg-gray-100 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="text-sm text-[#4A5568] font-medium mb-1 block">
                  Name
                </label>
                <input
                  type="text"
                  value={showEditPopup.name}
                  onChange={(e) =>
                    setShowEditPopup({ ...showEditPopup, name: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-[#E2E8F0] rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="text-sm text-[#4A5568] font-medium mb-1 block">
                  Email
                </label>
                <input
                  type="email"
                  value={showEditPopup.email}
                  onChange={(e) =>
                    setShowEditPopup({ ...showEditPopup, email: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-[#E2E8F0] rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="text-sm text-[#4A5568] font-medium mb-1 block">
                  Problem Statement ID
                </label>
                <input
                  type="text"
                  value={showEditPopup.problemStatementId}
                  onChange={(e) =>
                    setShowEditPopup({
                      ...showEditPopup,
                      problemStatementId: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-[#E2E8F0] rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="text-sm text-[#4A5568] font-medium mb-1 block">
                  Problem Statement
                </label>
                <input
                  type="text"
                  value={showEditPopup.problemStatement}
                  onChange={(e) =>
                    setShowEditPopup({
                      ...showEditPopup,
                      problemStatement: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-[#E2E8F0] rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="text-sm text-[#4A5568] font-medium mb-1 block">
                  Department
                </label>
                <select
                  value={showEditPopup.dept}
                  onChange={(e) =>
                    setShowEditPopup({ ...showEditPopup, dept: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-[#E2E8F0] rounded-xl text-sm"
                >
                  <option value="CSE">CSE</option>
                  <option value="ECE">ECE</option>
                  <option value="EEE">EEE</option>
                  <option value="MECH">MECH</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-[#4A5568] font-medium mb-1 block">
                  Password
                </label>
                <input
                  type="password"
                  value={showEditPopup.password}
                  onChange={(e) =>
                    setShowEditPopup({ ...showEditPopup, password: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-[#E2E8F0] rounded-xl text-sm"
                  placeholder="Leave blank to keep current password" // Hint for users
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 pt-6">
              <button
                type="button"
                onClick={() => setShowEditPopup(null)}
                className="px-5 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#FF9900] hover:bg-[#E68500] text-white rounded-xl text-sm font-semibold"
              >
                Update
              </button>
            </div>
          </form>
        </Popup>
      )}

      {/* Problem Statements Popup */}
      <Popup
        visible={showProblemStatementPopup}
        onClose={() => setShowProblemStatementPopup(false)}
      >
        <h2 className="text-xl font-semibold text-[#1A202C] mb-5">
          All Problem Statements
        </h2>
        <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
          {uniqueProblemStatements.map((ps) => (
            <div
              key={ps.id}
              className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
            >
              <span className="text-sm text-gray-700">{ps.title}</span>
              <a
                href={`/problem-statements/${ps.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-blue-600 hover:underline"
              >
                {ps.id}
              </a>
            </div>
          ))}
        </div>
        <div className="flex justify-end mt-6">
          <button
            onClick={() => setShowProblemStatementPopup(false)}
            className="px-5 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-semibold"
          >
            Close
          </button>
        </div>
      </Popup>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium transition-all duration-300 transform ${
            toast ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          } ${toast.type === "success" ? "bg-green-500" : "bg-red-500"}`}
        >
          {toast.type === "success" ? (
            <FiCheckCircle className="inline mr-2" />
          ) : (
            <FiXCircle className="inline mr-2" />
          )}
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default EvaluatorList;