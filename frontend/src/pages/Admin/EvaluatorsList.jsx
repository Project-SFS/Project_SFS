/**
 * @file EvaluatorsList.jsx
 * @description Displays a list of all evaluators on the platform for administrative review.
 */
import React, { useState, useMemo } from "react";
import { useEffect } from "react";
import axios from "axios"
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
import { URL } from "../../Utils";

const Popup = ({ children, visible, onClose }) => (
  <div
    className={`fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
  >
    <div
      className={`bg-white rounded-2xl shadow-xl p-6 w-[90%] max-w-lg transition-all duration-300 ${visible ? "scale-100 opacity-100" : "scale-95 opacity-0"
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

const EvaluatorList = () => {
  const [activeView, setActiveView] = useState('evaluators'); // 'evaluators' or 'spoc'
  const [evaluators, setEvaluators] = useState([]);
  const [spocs, setSpocs] = useState([]);

  /* useEffect(() => {
    GetAllEvaluators()
  }, []) */

  const [availableProblemStatements, setAvailableProblemStatements] = useState([]);

  useEffect(() => {
    // Fetch Problems
    const fetchProblems = async () => {
      try {
        const res = await fetch(`${URL}/get_problems`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();

        let problemsData = [];
        if (Array.isArray(json)) {
          problemsData = json;
        } else if (json.problems && Array.isArray(json.problems)) {
          problemsData = json.problems;
        } else if (json.data && Array.isArray(json.data)) {
          problemsData = json.data;
        }

        const mapped = problemsData.map(p => ({
          id: p.ID ? String(p.ID) : (p.id ? String(p.id) : ''),
          title: p.TITLE || p.title || 'Untitled',
          submissionCount: p.submissionsCount || 0
        }));
        setAvailableProblemStatements(mapped);
      } catch (err) {
        
      }
    };

    // Fetch Evaluators
    const fetchEvaluators = async () => {
      try {
        const res = await axios.get(`${URL}/evaluators`);
        const mappedEvaluators = (res.data || []).map(ev => ({
          id: ev.ID ? String(ev.ID) : (ev.id || ''),
          name: ev.NAME || ev.name || 'Unknown',
          email: ev.EMAIL || ev.email || '',
          dept: ev.COLLEGE || ev.dept || 'N/A', // Using College as Dept if Dept is missing/undefined in Users table
          college: ev.COLLEGE || ev.college || 'N/A',
          collegeId: ev.COLLEGE_CODE || ev.collegeId || 'N/A',
          dateJoined: ev.DATE || ev.dateJoined || new Date().toLocaleDateString(),
          status: ev.STATUS || ev.status || 'Active',
          problemStatements: [], // Relationships not fetched by default yet
          password: ev.PASSWORD || "", // needed for edit mode
        }));
        setEvaluators(mappedEvaluators);
      } catch (err) {
     
      }
    };

    // Fetch SPOC
    const fetchSpocs = async () => {
      try {
        // This route is protected on the backend; include credentials so cookie-based auth is sent
        const res = await axios.get(`${URL}/get_all_users`, { withCredentials: true });
        const users = res.data || [];
        const mappedSpocs = users
          .filter(user => {
            const role = (user.ROLE || user.role || '').toString().toUpperCase();
            return role === 'SPOC';
          })
          .map(spoc => ({
            id: spoc.ID ? String(spoc.ID) : (spoc.id || ''),
            name: spoc.NAME || spoc.name || 'Unknown',
            email: spoc.EMAIL || spoc.email || '',
            dept: spoc.COLLEGE || spoc.dept || 'N/A',
            college: spoc.COLLEGE || spoc.college || 'N/A',
            collegeId: spoc.COLLEGE_CODE || spoc.collegeId || 'N/A',
            dateJoined: spoc.DATE || spoc.dateJoined || new Date().toLocaleDateString(),
            status: spoc.STATUS || spoc.status || 'Active',
            problemStatements: [], // SPOC may not have problem statements
            password: spoc.PASSWORD || "",
          }));
        setSpocs(mappedSpocs);
      } catch (err) {
     
        // If the request fails due to auth, ensure spocs is empty rather than leaving stale data
        setSpocs([]);
      }
    };

    fetchProblems();
    fetchEvaluators();
    fetchSpocs();
  }, []);




  // State for popups
  const [showCreatePopup, setShowCreatePopup] = useState(false);
  const [showDetailsPopup, setShowDetailsPopup] = useState(null);
  const [showEditPopup, setShowEditPopup] = useState(null);
  const [showProblemStatementPopup, setShowProblemStatementPopup] = useState(false);
  const [toast, setToast] = useState(null);
  const [selectedProblemToAdd, setSelectedProblemToAdd] = useState(""); // State for assignment dropdown
  const [assignmentSearchTerm, setAssignmentSearchTerm] = useState(""); // State for assignment search
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
      problemStatements: [],
      collegeId: "N/A",
      dateJoined: new Date().toLocaleDateString(),
      completed: 0,
      pending: 0,
    };
    setEvaluators([...evaluators, newEval]);
    setNewEvaluator({ name: "", email: "", dept: "", password: "" }); // Reset password field
    setShowCreatePopup(false);
    showToast("Evaluator created successfully!", "success");
  };

  const handleDelete = (id) => {
    if (activeView === 'evaluators') {
      setEvaluators(evaluators.filter((ev) => ev.id !== id));
      showToast("Evaluator deleted successfully!", "success");
    } else {
      setSpocs(spocs.filter((spoc) => spoc.id !== id));
      showToast("SPOC deleted successfully!", "success");
    }
  };

  const handleEditSave = (updatedItem) => {
    if (activeView === 'evaluators') {
      setEvaluators(
        evaluators.map((ev) => (ev.id === updatedItem.id ? updatedItem : ev))
      );
      showToast("Evaluator updated successfully!", "success");
    } else {
      setSpocs(
        spocs.map((spoc) => (spoc.id === updatedItem.id ? updatedItem : spoc))
      );
      showToast("SPOC updated successfully!", "success");
    }
    setShowEditPopup(null);
  };

  const handleViewDetails = (evaluator) => {
    setShowDetailsPopup(evaluator);
  };

  // Assignment Handlers
  const handleAddProblem = () => {
    if (!selectedProblemToAdd) return;
    const problemToAdd = availableProblemStatements.find(p => p.id === selectedProblemToAdd);

    // Check if already assigned
    if (showEditPopup.problemStatements.some(ps => ps.id === problemToAdd.id)) {
      showToast("Problem already assigned", "error");
      return;
    }

    setShowEditPopup({
      ...showEditPopup,
      problemStatements: [...(showEditPopup.problemStatements || []), problemToAdd]
    });
    setSelectedProblemToAdd(""); // Reset dropdown
  };



  // Stats Calculations using useMemo for efficiency
  const totalEvaluators = evaluators.length;
  const totalSpocs = spocs.length;
  const uniqueProblemStatements = useMemo(() => {
    const problemMap = new Map();
    evaluators.forEach((ev) => {
      if (ev.problemStatements && Array.isArray(ev.problemStatements)) {
        ev.problemStatements.forEach(ps => {
          problemMap.set(ps.id, {
            id: ps.id,
            title: ps.title,
          });
        });
      }
    });
    return Array.from(problemMap.values());
  }, [evaluators]);
  const totalProblemStatements = uniqueProblemStatements.length;



  return (
    <div className="min-h-screen bg-[#F7F8FC] px-6 py-8 transition-all duration-300">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-[#1A202C] mb-1">
            {activeView === 'evaluators' ? 'Evaluators' : 'SPOC'}
          </h1>
          <p className="text-[#718096] text-sm">
            Manage {activeView === 'evaluators' ? 'evaluator profiles and track problem statements' : 'SPOC profiles'}.
          </p>
          {/* Pill Switch */}
          <div className="flex mt-4 space-x-2">
            <button
              onClick={() => setActiveView('evaluators')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeView === 'evaluators'
                  ? 'bg-[#FF9900] text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Evaluators
            </button>
            <button
              onClick={() => setActiveView('spoc')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeView === 'spoc'
                  ? 'bg-[#FF9900] text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              SPOC
            </button>
          </div>
        </div>
        {/* <button
          onClick={() => setShowCreatePopup(true)}
          className="flex items-center gap-2 bg-[#FF9900] hover:bg-[#E68500] text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-all mt-4 sm:mt-0"
        >
          <FiPlus /> Create New Evaluator
        </button> */}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-5 flex items-center gap-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
          <div className="bg-[#FFF4E5] p-4 rounded-xl">
            <FiUsers className="text-[#FF9900] text-2xl" />
          </div>
          <div>
            <p className="text-sm text-[#718096]">Total {activeView === 'evaluators' ? 'Evaluators' : 'SPOC'}</p>
            <p className="text-2xl font-bold text-[#1A202C]">
              {activeView === 'evaluators' ? totalEvaluators : totalSpocs}
            </p>
          </div>
        </div>
        
      </div>

      {/* Table */}
      <div className="bg-white shadow-sm rounded-2xl border border-[#E2E8F0] overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-[#F7F8FC] text-[#718096]">
            <tr>
              <th className="text-left py-3 px-5 font-semibold">{activeView === 'evaluators' ? 'Evaluator ID' : 'SPOC ID'}</th>
              <th className="text-left py-3 px-5 font-semibold">Name</th>
              <th className="text-left py-3 px-5 font-semibold">Email</th>
              <th className="text-left py-3 px-5 font-semibold">Organization</th>
              {/* <th className="text-left py-3 px-5 font-semibold">Actions</th> */}
              
            </tr>
          </thead>
          <tbody>
            {(activeView === 'evaluators' ? evaluators : spocs).map((item) => (
              <tr
                key={item.id}
                className="hover:bg-gray-50 border-t border-[#E2E8F0] transition-all"
              >
                <td
                  onClick={() => handleViewDetails(item)}
                  className="py-4 px-5 font-medium text-[#1A202C] cursor-pointer hover:text-[#FF9900] transition-colors"
                >
                  {item.id}
                </td>
                <td
                  onClick={() => handleViewDetails(item)}
                  className="py-4 px-5 cursor-pointer hover:text-[#FF9900] transition-colors"
                >
                  {item.name}
                </td>
                <td className="py-4 px-5 text-[#718096]">{item.email}</td>
                <td className="py-4 px-5 text-[#718096]">{item.college || item.dept}</td>
                {/* <td className="py-4 px-5 text-center space-x-4">
                  <button
                    onClick={() => setShowEditPopup(item)}
                    className="text-gray-500 hover:text-[#FF9900] transition-all"
                  >
                    <FiEdit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-gray-500 hover:text-red-600 transition-all"
                  >
                    <FiTrash2 size={18} />
                  </button>
                </td> */}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- POPUPS --- */}

      {/* Create Popup */}


      {/* Details Popup */}
      {showDetailsPopup && (
        <Popup visible={!!showDetailsPopup} onClose={() => setShowDetailsPopup(null)}>
          <h2 className="text-xl font-bold text-[#1A202C] mb-6 border-b pb-3">
            {activeView === 'evaluators' ? 'Evaluator Profile' : 'SPOC Profile'}
          </h2>
          <div className="space-y-4 text-sm text-[#2D3748]">
            <div className="flex">
              <span className="font-semibold text-[#718096] w-40">{activeView === 'evaluators' ? 'Evaluator ID:' : 'SPOC ID:'}</span>
              <span className="font-medium text-[#1A202C]">{showDetailsPopup.id}</span>
            </div>
            <div className="flex">
              <span className="font-semibold text-[#718096] w-40">Name:</span>
              <span className="font-medium text-[#1A202C]">{showDetailsPopup.name}</span>
            </div>
            <div className="flex">
              <span className="font-semibold text-[#718096] w-40">Email:</span>
              <span className="font-medium text-[#1A202C]">{showDetailsPopup.email}</span>
            </div>
            <div className="flex">
              <span className="font-semibold text-[#718096] w-40">Organization</span>
              <span className="font-medium text-[#1A202C]">{showDetailsPopup.college || 'N/A'}</span>
            </div>
            {/* <div className="flex">
              <span className="font-semibold text-[#718096] w-40">College ID:</span>
              <span className="font-medium text-[#1A202C]">{showDetailsPopup.collegeId || 'N/A'}</span>
            </div> */}
            <div className="flex">
              <span className="font-semibold text-[#718096] w-40">Joined Date:</span>
              <span className="font-medium text-[#1A202C]">{showDetailsPopup.dateJoined || 'N/A'}</span>
            </div>
            {/* <div className="flex">
              <span className="font-semibold text-[#718096] w-40">Problem Statements:</span>
              <span className="font-medium text-[#1A202C]">{showDetailsPopup.problemStatements?.length || 0}</span>
            </div> */}

            {/* <div className="mt-4">
              <span className="font-semibold text-[#718096] block mb-2">Assigned Problem Statements:</span>
              <div className="flex flex-wrap gap-2">
                {showDetailsPopup.problemStatements && showDetailsPopup.problemStatements.length > 0 ? (
                  showDetailsPopup.problemStatements.map((ps) => (
                    <div key={ps.id} className="group relative">
                      <a
                        href="#"
                        onClick={(e) => e.preventDefault()}
                        className="px-3 py-1 bg-blue-50 text-blue-600 rounded-md text-xs font-semibold hover:bg-blue-100 transition-colors"
                      >
                        {ps.id}
                      </a>

                     
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 bg-gray-900 text-white text-xs rounded-lg py-2 px-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 shadow-xl">
                        <p className="font-bold mb-1 border-b border-gray-700 pb-1">{ps.title}</p>
                        <p className="text-gray-300">Submissions: <span className="text-white font-bold">{ps.submissionCount}</span></p>
                        
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-8 border-transparent border-t-gray-900"></div>
                      </div>
                    </div>
                  ))
                ) : (
                  <span className="text-gray-400 italic">No problem statements assigned.</span>
                )}
              </div>
            </div>*/}
          </div> 

          <div className="flex justify-end mt-8">
            <button
              onClick={() => setShowDetailsPopup(null)}
              className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold transition-colors"
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
            {activeView === 'evaluators' ? 'Edit Evaluator' : 'Edit SPOC'}
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
                  {activeView === 'evaluators' ? 'Evaluator ID' : 'SPOC ID'}
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

              {/* Assignment Management */}
              {/* <div>
                <label className="text-sm text-[#4A5568] font-medium mb-1 block">
                  Assigned Problem Statements
                </label>
                <div className="flex overflow-x-auto overflow-y-hidden gap-2 mb-2 p-2 border border-[#E2E8F0] rounded-xl min-h-[42px] whitespace-nowrap scrollbar-thin scrollbar-thumb-gray-300">
                  {showEditPopup.problemStatements && showEditPopup.problemStatements.map((ps) => (
                    <span key={ps.id} className="flex-shrink-0 flex items-center px-2 py-1 bg-orange-100 text-orange-700 rounded-md text-xs font-semibold">
                      {ps.id}
                      <button
                        type="button"
                        onClick={() => handleRemoveProblem(ps.id)}
                        className="ml-1 text-orange-500 hover:text-orange-900 focus:outline-none"
                      >
                        <FiXCircle size={14} />
                      </button>
                    </span>
                  ))}
                  {(!showEditPopup.problemStatements || showEditPopup.problemStatements.length === 0) && (
                    <span className="text-gray-400 text-xs italic p-1">No assignments</span>
                  )}
                </div>

                <div className="flex flex-col gap-3">
                  <input
                    type="text"
                    value={assignmentSearchTerm}
                    onChange={(e) => {
                      setAssignmentSearchTerm(e.target.value);
                      setSelectedProblemToAdd(""); // Clear selection on search change to force re-selection
                    }}
                    placeholder="Search for a problem statement to assign..."
                    className="w-full px-4 py-2 border border-[#E2E8F0] rounded-xl text-sm focus:ring-1 focus:ring-orange-300 outline-none"
                  />
                  <div className="text-xs text-gray-500 px-1">
                    {availableProblemStatements
                      .filter(p => !showEditPopup.problemStatements?.some(existing => existing.id === p.id))
                      .filter(p =>
                        String(p.title || "").toLowerCase().includes(assignmentSearchTerm.toLowerCase()) ||
                        String(p.id || "").toLowerCase().includes(assignmentSearchTerm.toLowerCase())
                      ).length
                    } options found
                  </div>
                  <div className="border border-[#E2E8F0] rounded-xl overflow-hidden">
                    <div className="max-h-48 overflow-y-auto bg-white">
                      {availableProblemStatements.length === 0 ? (
                        <div className="p-3 text-sm text-gray-400 text-center">Loading problems...</div>
                      ) : (
                        (() => {
                          const filtered = availableProblemStatements
                            .filter(p => !showEditPopup.problemStatements?.some(existing => existing.id === p.id))
                            .filter(p =>
                              String(p.title || "").toLowerCase().includes(assignmentSearchTerm.toLowerCase()) ||
                              String(p.id || "").toLowerCase().includes(assignmentSearchTerm.toLowerCase())
                            );

                          if (filtered.length === 0) {
                            return <div className="p-3 text-sm text-gray-400 text-center">No matching problems found</div>;
                          }

                          return filtered.map(p => (
                            <div
                              key={p.id}
                              onClick={() => setSelectedProblemToAdd(p.id)}
                              className={`px-4 py-3 text-sm border-b border-gray-100 last:border-0 cursor-pointer transition-colors flex justify-between items-center ${selectedProblemToAdd === p.id
                                ? 'bg-orange-50 text-orange-900 font-medium'
                                : 'hover:bg-gray-50 text-gray-700'
                                }`}
                            >
                              <span>
                                <span className="font-semibold text-xs text-gray-500 mr-2">{p.id}</span>
                                {p.title}
                              </span>
                              {selectedProblemToAdd === p.id && <FiCheckCircle className="text-orange-500" />}
                            </div>
                          ));
                        })()
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddProblem}
                    disabled={!selectedProblemToAdd}
                    className={`w-full px-6 h-[42px] rounded-xl text-sm font-semibold transition-colors flex items-center justify-center whitespace-nowrap ${selectedProblemToAdd
                      ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-md'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                  >
                    Assign Selected Problem
                  </button>
                </div>
              </div> */}
              <div>
                <label className="text-sm text-[#4A5568] font-medium mb-1 block">
                  Organization
                </label>
                <input
                  type="text"
                  value={showEditPopup.college}
                  onChange={(e) =>
                    setShowEditPopup({ ...showEditPopup, college: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-[#E2E8F0] rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="text-sm text-[#4A5568] font-medium mb-1 block">
                  Organization ID
                </label>
                <input
                  type="text"
                  value={showEditPopup.collegeId}
                  onChange={(e) =>
                    setShowEditPopup({
                      ...showEditPopup,
                      collegeId: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-[#E2E8F0] rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="text-sm text-[#4A5568] font-medium mb-1 block">
                  Date Joined
                </label>
                <input
                  type="text"
                  value={showEditPopup.dateJoined}
                  onChange={(e) =>
                    setShowEditPopup({
                      ...showEditPopup,
                      dateJoined: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-[#E2E8F0] rounded-xl text-sm"
                  placeholder="YYYY-MM-DD"
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
              {/* <div>
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
              </div> */}
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
          className={`fixed bottom-6 right-6 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium transition-all duration-300 transform ${toast ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
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
