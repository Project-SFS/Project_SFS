import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaUsers, FaClipboardList, FaUser } from "react-icons/fa";
import ProblemStatements from "../../components/ProblemStatements";
import SPOCProfile from "./SPOCProfile";
import axios from "axios"
import { URL } from "../../Utils";
import { useNavigate } from "react-router-dom";
const DashboardWithSide = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [activeView, setActiveView] = useState("dashboard");
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [FullTeam, setFullTeam] = useState([]);
  const navigate = useNavigate();
  const [teamFormData, setTeamFormData] = useState({
    teamName: '',
    members: [
      { role: 'Team Lead', name: '', email: '', phone: '', gender: '' },
      { role: 'Member 1', name: '', email: '', phone: '', gender: '' },
      { role: 'Member 2', name: '', email: '', phone: '', gender: '' },
      { role: 'Member 3', name: '', email: '', phone: '', gender: '' }
    ]
  });
  function allteams() {
    /
    axios.get(`${URL}/fetch_teams`).then(res => { setFullTeam(res.data) })

  }

  function SelectedTeam(team) {

    navigate(`/spoc/team_details/${team.ID}`)
    // axios.post(`${URL}/fetch_team_members/${team.ID}`).then(res => setSelectedTeam(res.data))
  }




  useEffect(() => {
    allteams()
  }, [])



  const teamsPerPage = 10;



  // Sample team list with members
  const teams1 = [
    {
      id: "T001",
      name: "Alpha Coders",
      leadEmail: "aarav.mehta@example.com",
      leadPhone: "+91 98765 43210",
      members: [
        { role: "Team Lead", name: "Aarav Mehta", email: "aarav.mehta@example.com", phone: "+91 98765 43210", gender: "Male" },
        { role: "Frontend Developer", name: "Priya Sharma", email: "priya.sharma@example.com", phone: "+91 99887 65432", gender: "Female" },
        { role: "Backend Developer", name: "Rohan Das", email: "rohan.das@example.com", phone: "+91 91234 56789", gender: "Male" },
      ],
    },
    {
      id: "T002",
      name: "Tech Titans",
      leadEmail: "neha.verma@example.com",
      leadPhone: "+91 97654 32109",
      members: [
        { role: "Team Lead", name: "Neha Verma", email: "neha.verma@example.com", phone: "+91 97654 32109", gender: "Female" },
        { role: "FullStack Developer", name: "Aditya", email: "aditya@example.com", phone: "+91 98567 89012", gender: "Male" },
        { role: "QA Engineer", name: "Kavya Reddy", email: "kavya.reddy@example.com", phone: "+91 93456 78901", gender: "Female" },
      ],
    },
  ];

  // Dummy teams for dashboard stats
  const teams = Array.from({ length: 42 }, (_, i) => ({
    id: i + 1,
    name: `Team ${i + 1}`,
    leader: `Leader ${i + 1}`,
    submitted: i % 2 === 0 ? "Submitted" : "Not Submitted",
  }));

  const totalTeams = teams.length;
  const totalTeamsSubmitted = teams.filter(
    (team) => team.submitted === "Submitted"
  ).length;

  const indexOfLastTeam = currentPage * teamsPerPage;
  const indexOfFirstTeam = indexOfLastTeam - teamsPerPage;
  const currentTeams = teams.slice(indexOfFirstTeam, indexOfLastTeam);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const pageNumbers = [];
  for (let i = 1; i <= Math.ceil(teams.length / teamsPerPage); i++) {
    pageNumbers.push(i);
  }

  const handleMemberChange = (memberIndex, field, value) => {
    setTeamFormData(prev => ({
      ...prev,
      members: prev.members.map((member, index) =>
        index === memberIndex ? { ...member, [field]: value } : member
      )
    }));
  };

  const handleTeamNameChange = (value) => {
    setTeamFormData(prev => ({ ...prev, teamName: value }));
  };

  const handleCreateTeam = (e) => {
    e.preventDefault();
 
    axios.defaults.withCredentials = true;
    axios.post(`${URL}/add_members`, teamFormData)
      .then((res) => {
       
        if (res.status == 200) {
          setShowCreateTeamModal(false);
          // Reset form
          setTeamFormData({
            teamName: '',
            members: [
              { role: 'Team Lead', name: '', email: '', phone: '', gender: '' },
              { role: 'Member 1', name: '', email: '', phone: '', gender: '' },
              { role: 'Member 2', name: '', email: '', phone: '', gender: '' },
              { role: 'Member 3', name: '', email: '', phone: '', gender: '' }
            ]
          });
          // Refresh the team list
          allteams();
        }
      })
      .catch((error) => {
        console.error('Error creating team:', error);
      });
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const tableVariants = {
    hidden: { opacity: 0, x: -50 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.5, delay: 0.2 },
    },
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 relative">
      {/* Sidebar */}
      <motion.aside
        onMouseEnter={() => setIsSidebarExpanded(true)}
        onMouseLeave={() => setIsSidebarExpanded(false)}
        // Match admin widths: w-64 (256px) when expanded, w-20 (80px) when collapsed
        animate={{ width: isSidebarExpanded ? 256 : 80 }}
        transition={{ duration: 0.3 }}
        className="fixed left-5 top-1/2 -translate-y-1/2 bg-[#494949] text-white rounded-2xl shadow-xl flex flex-col items-center py-6 z-20"
      >
        <nav className="w-full">
          <ul className="flex flex-col gap-4 px-2 mx-auto">
            <li>
              <button
                onClick={() => setActiveView("dashboard")}
                className={`flex items-center w-full p-3 rounded-lg transition-all duration-300 ${activeView === "dashboard" ? "bg-gray-700" : "hover:bg-gray-700"
                  }`}
              >
                <FaUsers className="text-xl mx-auto" />
                {isSidebarExpanded && <span className="ml-3 text-sm font-medium">Dashboard</span>}
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveView("problems")}
                className={`flex items-center w-full p-3 rounded-lg transition-all duration-300 ${activeView === "problems" ? "bg-gray-700" : "hover:bg-gray-700"
                  }`}
              >
                <FaClipboardList className="text-xl mx-auto" />
                {isSidebarExpanded && <span className="ml-3 text-sm font-medium">Problems</span>}
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveView("profile")}
                className={`flex items-center w-full p-3 rounded-lg transition-all duration-300 ${activeView === "profile" ? "bg-gray-700" : "hover:bg-gray-700"
                  }`}
              >
                <FaUser className="text-xl mx-auto" />
                {isSidebarExpanded && <span className="ml-3 text-sm font-medium">Profile</span>}
              </button>
            </li>
            <li>
              <button
                onClick={() => navigate("/spoc/team")}
                className={`flex items-center w-full p-3 rounded-lg transition-all duration-300 ${activeView === "teamlist" ? "bg-gray-700" : "hover:bg-gray-700"
                  }`}
              >
                <FaUsers className="text-xl mx-auto" />
                {isSidebarExpanded && <span className="ml-3 text-sm font-medium">Team List</span>}
              </button>
            </li>
          </ul>
        </nav>
      </motion.aside>

      {/* Main Content */}
      <main className={`flex-1 p-10 transition-all duration-300 mt-16 ${isSidebarExpanded ? 'ml-64' : 'ml-20'}`}>
        {activeView === "dashboard" && (
          <>
            <h1 className="text-3xl font-bold mb-8 text-gray-800">
              SPOC Dashboard
            </h1>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <motion.div
                className="bg-white p-6 rounded-lg shadow-lg"
                variants={cardVariants}
                initial="hidden"
                animate="visible"
              >
                <h2 className="text-xl font-semibold text-gray-700 mb-2">
                  Total Teams
                </h2>
                <p className="text-4xl font-bold text-[#fc8f00]">{totalTeams}</p>
              </motion.div>
              <motion.div
                className="bg-white p-6 rounded-lg shadow-lg"
                variants={cardVariants}
                initial="hidden"
                animate="visible"
              >
                <h2 className="text-xl font-semibold text-gray-700 mb-2">
                  Total Teams Submitted
                </h2>
                <p className="text-4xl font-bold text-[#fc8f00]">
                  {totalTeamsSubmitted}
                </p>
              </motion.div>
            </div>

            {/* Teams Table */}
            <motion.div
              className="bg-white p-6 rounded-lg shadow-lg"
              variants={tableVariants}
              initial="hidden"
              animate="visible"
            >
              <h2 className="text-xl font-semibold text-gray-700 mb-4">
                Teams List
              </h2>
              <table className="min-w-full bg-white">
                <thead>
                  <tr>
                    <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Team Name
                    </th>
                    <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Leader
                    </th>
                    <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentTeams.map((team) => (
                    <tr key={team.id}>
                      <td className="py-2 px-4 border-b border-gray-200">{team.name}</td>
                      <td className="py-2 px-4 border-b border-gray-200">{team.leader}</td>
                      <td className="py-2 px-4 border-b border-gray-200">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${team.submitted === "Submitted"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                            }`}
                        >
                          {team.submitted}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="py-3 flex justify-center">
                <nav>
                  <ul className="flex pl-0 list-none flex-wrap">
                    {pageNumbers.map((number) => (
                      <li key={number}>
                        <a
                          onClick={() => paginate(number)}
                          href="#"
                          className={`w-8 h-8 mx-1 flex items-center justify-center rounded-full border border-gray-300 text-xs font-semibold ${currentPage === number
                            ? "bg-[#fc8f00] text-white"
                            : "text-gray-800"
                            }`}
                        >
                          {number}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              </div>
            </motion.div>
          </>
        )}

        {activeView === "problems" && <ProblemStatements showHeader={false} />}
        {activeView === "profile" && <SPOCProfile />}

        {/* Team List View */}
        {activeView === "teamlist" && (
          <div className="max-w-5xl mx-auto">
            <AnimatePresence mode="wait">
              {!selectedTeam ? (
                <motion.div
                  key="team-list"
                  variants={tableVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  className="bg-white p-6 rounded-lg shadow-lg"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">
                      Team List
                    </h2>
                    <button
                      onClick={() => setShowCreateTeamModal(true)}
                      className="bg-[#fc8f00] text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors font-medium"
                    >
                      + Create Team
                    </button>
                  </div>
                  <table className="min-w-full border border-gray-200">
                    <thead className="bg-gray-100 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Team ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Team Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Lead Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Lead Phone
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {FullTeam.map((team) => (
                        <tr
                          key={team.ID}
                          onClick={() => SelectedTeam(team)}
                          className="hover:bg-gray-50 cursor-pointer"
                        >
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {team.ID}
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            {team.NAME}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {team.LEAD_EMAIL}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {team.LEAD_PHONE}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </motion.div>
              ) : (
                <motion.div
                  key="team-details"
                  variants={tableVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  className="bg-white p-6 rounded-lg shadow-lg"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">
                      {selectedTeam.NAME} - Members
                    </h2>
                    <button
                      onClick={() => setSelectedTeam(null)}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      ← Back to Teams
                    </button>
                  </div>

                  <table className="min-w-full border border-gray-200">
                    <thead className="bg-gray-100 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Phone
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Gender
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {selectedTeam.map((m, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 transition">
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {m.ROLE}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {m.NAME}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {m.EMAIL}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {m.PHONE}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {m.GENDER}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Create Team Modal */}
      {showCreateTeamModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/20 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-4"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800">Create New Team</h3>
              <button
                onClick={() => setShowCreateTeamModal(false)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTeam}>
              {/* Team Name */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Team Name
                </label>
                <input
                  type="text"
                  value={teamFormData.teamName}
                  onChange={(e) => handleTeamNameChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#fc8f00]"
                  placeholder="Enter team name"
                  required
                />

              </div>

              {/* Team Members */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Team Members</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {teamFormData.members.map((member, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <h5 className="font-medium text-gray-700 mb-3">{member.role}</h5>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">Name</label>
                          <input
                            type="text"
                            value={member.name}
                            onChange={(e) => handleMemberChange(index, 'name', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#fc8f00]"
                            placeholder="Enter name"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm text-gray-600 mb-1">Email</label>
                          <input
                            type="email"
                            value={member.email}
                            onChange={(e) => handleMemberChange(index, 'email', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#fc8f00]"
                            placeholder="Enter email"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm text-gray-600 mb-1">Phone</label>
                          <input
                            type="tel"
                            value={member.phone}
                            onChange={(e) => handleMemberChange(index, 'phone', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#fc8f00]"
                            placeholder="Enter phone number"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm text-gray-600 mb-1">Gender</label>
                          <select
                            value={member.gender}
                            onChange={(e) => handleMemberChange(index, 'gender', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#fc8f00]"
                            required
                          >
                            <option value="">Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowCreateTeamModal(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#fc8f00] text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Create Team
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default DashboardWithSide;
