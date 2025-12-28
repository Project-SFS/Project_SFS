t TeamList;

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { URL } from "../../Utils";
import { useNavigate } from "react-router-dom";
import { FaUsers } from "react-icons/fa";
import toast, { Toaster } from "react-hot-toast";
import { IoTrashBinOutline } from "react-icons/io5";
import { FaRegEdit } from "react-icons/fa";

function TeamList() {
  const [FullTeam, setFullTeam] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [activeView, setActiveView] = useState("teamlist");
  const [spoc_id, setspoc_id] = useState();
  const [fetched, setfetched] = useState(false);
  const [fetch_team_members, setfetch_team_members] = useState([]);
  const [fetched_s, setfetched_s] = useState(true);
  const [team_id, setteam_id] = useState();
  const [spoc_data, setSpoc_data] = useState();

  const navigate = useNavigate();

  const [teamFormData, setTeamFormData] = useState({
    teamName: "",
    members: [
      { role: "Team Lead", name: "", email: "", phone: "", gender: "" },
      { role: "Member 1", name: "", email: "", phone: "", gender: "" },
      { role: "Member 2", name: "", email: "", phone: "", gender: "" },
      { role: "Member 3", name: "", email: "", phone: "", gender: "" },
    ],
  });

  const [mentorName, setMentorName] = useState("");
  const [mentorEmail, setMentorEmail] = useState("");

  axios.defaults.withCredentials = true;

  // Fetch cookie / SPOC data once
  useEffect(() => {
    axios.get(`${URL}/cookie`).then((res) => {
      setspoc_id(res.data.ID);
      setSpoc_data(res.data);
    });
  }, []);

  const handleMentorChange = (field, value) => {
    if (field === "mentorName") {
      setMentorName(value);
    } else if (field === "mentorEmail") {
      setMentorEmail(value);
    }
  };

  function allteams() {
    axios
      .post(`${URL}/fetch_teams/${spoc_id}`)
      .then((res) => {
        setFullTeam(res.data);
        setfetched(true);
      })
      .catch((err) => console.error("Error fetching teams:", err));
  }

  function SelectedTeam(team) {
    navigate(`/spoc/team_details`, { state: { id: team.ID } });
  }

  useEffect(() => {
    if (spoc_id) {
      allteams();
    }
  }, [spoc_id]);

  const handleMemberChange = (index, field, value) => {
    setTeamFormData((prev) => ({
      ...prev,
      members: prev.members.map((member, i) =>
        i === index ? { ...member, [field]: value } : member
      ),
    }));
  };

  const handleEditMembers = (e) => {
    axios.post(`${URL}/fetch_team_members`, { id: e.ID }).then((res) => {
      setteam_id(e.ID);
      setfetch_team_members(res.data);
      setTeamFormData({
        teamName: e.NAME,
        members: [
          {
            role: "Team Lead",
            name: res.data.result[0].NAME,
            email: res.data.result[0].EMAIL,
            phone: res.data.result[0].PHONE,
            gender: res.data.result[0].GENDER,
          },
          {
            role: "Member 1",
            name: res.data.result[1].NAME,
            email: res.data.result[1].EMAIL,
            phone: res.data.result[1].PHONE,
            gender: res.data.result[1].GENDER,
          },
          {
            role: "Member 2",
            name: res.data.result[2].NAME,
            email: res.data.result[2].EMAIL,
            phone: res.data.result[2].PHONE,
            gender: res.data.result[2].GENDER,
          },
          {
            role: "Member 3",
            name: res.data.result[3].NAME,
            email: res.data.result[3].EMAIL,
            phone: res.data.result[3].PHONE,
            gender: res.data.result[3].GENDER,
          },
        ],
      });
      setMentorEmail(res.data.mentor[0].MENTOR_EMAIL);
      setMentorName(res.data.mentor[0].MENTOR_NAME);
    });
    setShowCreateTeamModal(true);
    setfetched_s(false);
  };

  const handleCreateTeam = (e) => {
    e.preventDefault();

    if (e.target[20].innerText == "Update team") {
      let load = toast.loading("Updating team...");
      axios
        .post(`${URL}/update_team`, {
          team: teamFormData,
          id: team_id,
          mentorEmail: mentorEmail,
          mentorName: mentorName,
        })
        .then((res) => {
          if (res.data == "Updated") {
            toast.dismiss(load);
            toast.success("Updated!");
            setShowCreateTeamModal(false);
            allteams();
          }
        });
    } else {
      const loadingToast = toast.loading("Creating team...");
      let mailToast;

      setTimeout(() => {
        toast.dismiss(loadingToast);
        mailToast = toast.loading("Sending mails...");
      }, 2000);

      axios
        .post(`${URL}/add_members/${spoc_id}`, {
          Teamdata: teamFormData,
          mentorEmail: mentorEmail,
          mentorName: mentorName,
        })
        .then((res) => {
          axios.post(`${URL}/register`, {
            email: teamFormData.members[0].email,
            password: spoc_data.COLLEGE_CODE + res.data,
            role: "STUDENT",
            college: spoc_data.COLLEGE,
            college_code: res.data,
            name: teamFormData.members[0].name,
            date: new Date().toString().split(" ").slice(0, 4).join(" "),
          });

          //  ;
          

          if (res.status === 200) {
            toast.dismiss(mailToast);
            toast.success("Mail sent successfully!", {
              duration: 3000,
              position: "top-right",
              style: {
                backgroundColor: "green",
                color: "white",
              },
            });
            toast.success("Team created successfully!", {
              duration: 3000,
              position: "top-right",
            });

            setShowCreateTeamModal(false);
            setTeamFormData({
              teamName: "",
              members: [
                { role: "Team Lead", name: "", email: "", phone: "", gender: "" },
                { role: "Member 1", name: "", email: "", phone: "", gender: "" },
                { role: "Member 2", name: "", email: "", phone: "", gender: "" },
                { role: "Member 3", name: "", email: "", phone: "", gender: "" },
              ],
            });
            allteams();
          }
        })
        .catch((error) => {
          toast.dismiss(loadingToast);
          toast.error("Failed to create team. Please try again.", {
            duration: 4000,
            position: "top-right",
          });
          console.error("Error creating team:", error);
        });
    }
  };

  const tableVariants = {
    hidden: { opacity: 0, x: -30 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.4 } },
  };

  const deleteteam = (team) => {
    if (window.confirm("Confirm delete ?")) {
      const del = toast.loading("Deleting team...");
      axios
        .post(`${URL}/delete_team`, { id: team.ID })
        .then((res) => {
          allteams();
          toast.dismiss(del);
          toast.success("Team deleted");
        })
        .catch((error) => {
          console.error("Error deleting team:", error);
          toast.error("Failed to delete team");
        });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header / Title */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-100">
              <FaUsers className="text-[#fc8f00]" />
              <span className="text-xs font-semibold uppercase tracking-wide text-[#fc8f00]">
                SPOC Dashboard
              </span>
            </div>
            <h1 className="mt-3 text-2xl sm:text-3xl font-bold text-gray-900">
              Team Management
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              View, create, update, and manage student teams seamlessly.
            </p>
          </div>

          <button
            onClick={() => setShowCreateTeamModal(true)}
            className="inline-flex items-center justify-center px-4 sm:px-5 py-2 rounded-lg bg-[#fc8f00] text-white text-sm font-medium shadow-sm hover:bg-orange-600 transition-colors"
          >
            + Create Team
          </button>
        </div>

        {/* Main Card */}
        <AnimatePresence mode="wait">
          {!selectedTeam ? (
            <motion.div
              key="team-list"
              variants={tableVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="bg-white rounded-xl shadow-md border border-gray-200"
            >
              <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-semibold text-gray-800">
                  Team List
                </h2>
                <span className="text-xs sm:text-sm text-gray-500">
                  Total Teams:{" "}
                  <span className="font-semibold text-gray-700">
                    {FullTeam.length || 0}
                  </span>
                </span>
              </div>

              <div className="px-4 sm:px-6 py-4">
                {!fetched ? (
                  <div className="rounded bg-white p-8 text-center">
                    <svg
                      className="mx-auto h-8 w-8 animate-spin text-[#0f62fe]"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      />
                    </svg>
                    <div className="mt-3 text-sm text-[#4a4a4a]">
                      Loading Teams...
                    </div>
                  </div>
                ) : FullTeam.length === 0 ? (
                  <div className="py-10 text-center text-sm text-gray-600">
                    No teams created yet. Click{" "}
                    <span className="font-semibold text-[#fc8f00]">
                      "Create Team"
                    </span>{" "}
                    to get started.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 sm:px-6 py-3 text-left text-[11px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Team ID
                          </th>
                          <th className="px-4 sm:px-6 py-3 text-left text-[11px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Team Name
                          </th>
                          <th className="px-4 sm:px-6 py-3 text-left text-[11px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Lead Email
                          </th>
                          <th className="px-4 sm:px-6 py-3 text-left text-[11px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Lead Phone
                          </th>
                          <th className="px-4 sm:px-6 py-3 text-center text-[11px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Edit
                          </th>
                          <th className="px-4 sm:px-6 py-3 text-center text-[11px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Delete
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {FullTeam.map((team) => (
                          <tr
                            key={team.ID}
                            className="hover:bg-gray-50 transition cursor-pointer"
                          >
                            <td
                              className="px-4 sm:px-6 py-3 text-gray-700 whitespace-nowrap"
                              onClick={() => SelectedTeam(team)}
                            >
                              <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-800">
                                {team.ID}
                              </span>
                            </td>
                            <td
                              className="px-4 sm:px-6 py-3 font-medium text-gray-900"
                              onClick={() => SelectedTeam(team)}
                            >
                              {team.NAME}
                            </td>
                            <td
                              className="px-4 sm:px-6 py-3 text-gray-600"
                              onClick={() => SelectedTeam(team)}
                            >
                              {team.LEAD_EMAIL}
                            </td>
                            <td
                              className="px-4 sm:px-6 py-3 text-gray-600"
                              onClick={() => SelectedTeam(team)}
                            >
                              {team.LEAD_PHONE}
                            </td>
                            <td className="px-4 sm:px-6 py-3 text-center">
                              <button
                                onClick={() => handleEditMembers(team)}
                                className="inline-flex items-center justify-center rounded-full p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 transition"
                              >
                                <FaRegEdit className="h-4 w-4" />
                              </button>
                            </td>
                            <td className="px-4 sm:px-6 py-3 text-center">
                              <button
                                onClick={() => deleteteam(team)}
                                className="inline-flex items-center justify-center rounded-full p-2 bg-red-50 hover:bg-red-100 text-red-600 transition"
                              >
                                <IoTrashBinOutline className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* ===== Modal ===== */}
      {showCreateTeamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-4"
          >
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
              <div>
                <h3 className="text-xl font-bold text-gray-800">
                  {fetched_s ? "Create New Team" : "Modify Team"}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Fill in team, mentor, and member details carefully.
                </p>
              </div>
              <button
                onClick={() => {
                  setShowCreateTeamModal(false);
                  setfetched_s(true);
                  setTeamFormData({
                    teamName: "",
                    members: [
                      {
                        role: "Team Lead",
                        name: "",
                        email: "",
                        phone: "",
                        gender: "",
                      },
                      {
                        role: "Member 1",
                        name: "",
                        email: "",
                        phone: "",
                        gender: "",
                      },
                      {
                        role: "Member 2",
                        name: "",
                        email: "",
                        phone: "",
                        gender: "",
                      },
                      {
                        role: "Member 3",
                        name: "",
                        email: "",
                        phone: "",
                        gender: "",
                      },
                    ],
                  });
                }}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTeam} className="px-6 py-5 space-y-6">
              {/* Team Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Team Name
                </label>
                <input
                  type="text"
                  value={teamFormData.teamName}
                  onChange={(e) =>
                    setTeamFormData({
                      ...teamFormData,
                      teamName: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#fc8f00]"
                  placeholder="Enter team name"
                  required
                />
              </div>

              {/* Mentor Details */}
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h4 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">
                  Mentor Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mentor Name
                    </label>
                    <input
                      type="text"
                      value={mentorName}
                      onChange={(e) =>
                        handleMentorChange("mentorName", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#fc8f00]"
                      placeholder="Enter mentor name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={mentorEmail}
                      onChange={(e) =>
                        handleMentorChange("mentorEmail", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#fc8f00]"
                      placeholder="Enter email"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Team Members */}
              <div>
                <h4 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">
                  Team Members
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {teamFormData.members.map((member, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                    >
                      <h5 className="font-medium text-gray-700 mb-3 text-sm">
                        {member.role}
                      </h5>
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={member.name}
                          onChange={(e) =>
                            handleMemberChange(index, "name", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#fc8f00]"
                          placeholder="Name"
                          required
                        />
                        <input
                          type="email"
                          value={member.email}
                          onChange={(e) =>
                            handleMemberChange(index, "email", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#fc8f00]"
                          placeholder="Email"
                          required
                        />
                        <input
                          type="tel"
                          value={member.phone}
                          onChange={(e) =>
                            handleMemberChange(index, "phone", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#fc8f00]"
                          placeholder="Phone"
                          required
                        />
                        <select
                          value={member.gender}
                          onChange={(e) =>
                            handleMemberChange(index, "gender", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#fc8f00]"
                          required
                        >
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2 pb-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateTeamModal(false);
                    setfetched_s(true);
                    setTeamFormData({
                      teamName: "",
                      members: [
                        {
                          role: "Team Lead",
                          name: "",
                          email: "",
                          phone: "",
                          gender: "",
                        },
                        {
                          role: "Member 1",
                          name: "",
                          email: "",
                          phone: "",
                          gender: "",
                        },
                        {
                          role: "Member 2",
                          name: "",
                          email: "",
                          phone: "",
                          gender: "",
                        },
                        {
                          role: "Member 3",
                          name: "",
                          email: "",
                          phone: "",
                          gender: "",
                        },
                      ],
                    });
                    setteam_id(0);
                  }}
                  className="px-5 py-2 border border-gray-300 text-sm text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#fc8f00] text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors"
                >
                  {fetched_s ? "Create team" : "Update team"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default TeamList;
