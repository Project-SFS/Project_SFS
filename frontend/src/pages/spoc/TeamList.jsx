// import React, { useEffect, useState } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import axios from "axios";
// import { URL } from "../../Utils";
// import { useNavigate } from "react-router-dom";
// import { FaUsers, FaClipboardList, FaUser } from "react-icons/fa";
// import toast, { Toaster } from 'react-hot-toast';
// import { IoTrashBinOutline } from "react-icons/io5";
// import { FaRegEdit } from "react-icons/fa";

// function TeamList() {
//     const [FullTeam, setFullTeam] = useState([]);
//     const [selectedTeam, setSelectedTeam] = useState(null);
//     const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
//     const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
//     const [activeView, setActiveView] = useState("teamlist");
//     const [spoc_id, setspoc_id] = useState()
//     const [fetched, setfetched] = useState(false)
//     const [fetch_team_members, setfetch_team_members] = useState([])
//     const [fetched_s, setfetched_s] = useState(true)
//     const [team_id, setteam_id] = useState() 
//     const [spoc_data,setSpoc_data] = useState()
    
//     const navigate = useNavigate();

//     const [teamFormData, setTeamFormData] = useState({
//         teamName: "",
//         members: [
//             { role: "Team Lead", name: "", email: "", phone: "", gender: "" },
//             { role: "Member 1", name: "", email: "", phone: "", gender: "" },
//             { role: "Member 2", name: "", email: "", phone: "", gender: "" },
//             { role: "Member 3", name: "", email: "", phone: "", gender: "" },
//         ],
//     });
//     axios.defaults.withCredentials = true
//     axios.get(`${URL}/cookie`).then(res => { setspoc_id(res.data.ID); setSpoc_data(res.data)} );

//     const[mentorName , setMentorName] = useState("");
//     const[mentorEmail , setMentorEmail] = useState("");

//     // Handle Mentor Details

//     const handleMentorChange = (field, value) => {
//         if (field === 'mentorName') {
//             setMentorName(value);   
//         } else if (field === 'mentorEmail') {
//             setMentorEmail(value);
//         }
        
//     }

    
    

//     // Fetch all teams


//     function allteams() {

//         axios
//             .post(`${URL}/fetch_teams/${spoc_id}`)
//             .then((res) => {
                
//             })
//             .catch((err) => console.error("Error fetching teams:", err));
//     }
//     // Navigate to selected team
//     function SelectedTeam(team) {
//         navigate(`/spoc/team_details`, { state: { id: team.ID } });
//     }

//     useEffect(() => {
//         if (spoc_id) {

//             allteams();
//         }
//     }, [spoc_id]);

//     // Handle form
//     const handleMemberChange = (index, field, value) => {
//         setTeamFormData((prev) => ({
//             ...prev,
//             members: prev.members.map((member, i) =>
//                 i === index ? { ...member, [field]: value } : member
//             ),
//         }));

//     };
    

//     const handleEditMembers = (e) => {
//         axios.post(`${URL}/fetch_team_members`, { id: e.ID }).then(res => {
//             setteam_id(e.ID)
            
//             setfetch_team_members(res.data)
//             setTeamFormData({
//                 teamName: e.NAME,
//                 members: [
//                     { role: "Team Lead", name: res.data.result[0].NAME, email: res.data.result[0].EMAIL, phone: res.data.result[0].PHONE, gender: res.data.result[0].GENDER },
//                     { role: "Member 1", name: res.data.result[1].NAME, email: res.data.result[1].EMAIL, phone: res.data.result[1].PHONE, gender: res.data.result[1].GENDER },
//                     { role: "Member 2", name: res.data.result[2].NAME, email: res.data.result[2].EMAIL, phone: res.data.result[2].PHONE, gender: res.data.result[2].GENDER },
//                     { role: "Member 3", name: res.data.result[3].NAME, email: res.data.result[3].EMAIL, phone: res.data.result[3].PHONE, gender: res.data.result[3].GENDER }

//                 ]
//             })
//             setMentorEmail(res.data.mentor[0].MENTOR_EMAIL)
//             setMentorName(res.data.mentor[0].MENTOR_NAME)

//         })
//         setShowCreateTeamModal(true)
//         setfetched_s(false)
//     }



//     const handleCreateTeam = (e) => {
//         e.preventDefault();
        
//         if (e.target[20].innerText == "Update team") {
//             let load = toast.loading("Updating team...")
//             axios.post(`${URL}/update_team`, { team: teamFormData, id: team_id, mentorEmail:mentorEmail, mentorName:mentorName })
//                 .then(res => {
//                     if (res.data == "Updated") {
//                         toast.dismiss(load);
//                         toast.success("Updated !");
//                         setShowCreateTeamModal(false);
//                         allteams();
//                     }
//                 })
//         }
//         else {

//             // Show loading toast
//             const loadingToast = toast.loading('Creating team...');
//             let mailToast;
//             setTimeout(() => {
//                 toast.dismiss(loadingToast);
//                 mailToast = toast.loading('Sending mails...');

//             }, 2000);
//             axios
//             .post(`${URL}/add_members/${spoc_id}`, { Teamdata: teamFormData, mentorEmail: mentorEmail, mentorName:mentorName })
//             .then( (res) => {
//                 axios.post(`${URL}/register`, { email: teamFormData.members[0].email, password: spoc_data.COLLEGE_CODE+res.data, role: 'STUDENT', college: spoc_data.COLLEGE, college_code: res.data, name: teamFormData.members[0].name, date: new Date().toString().split(" ").slice(0, 4).join(" ") })
                
//                 if (res.status === 200) {
//                     // Dismiss loading toast and show success toast
//                     toast.dismiss(mailToast)
//                     toast.success('Mail sent successfully!', {
//                         duration: 3000,
//                         position: 'top-right',
//                         style: {
//                             backgroundColor: "green",
//                             color: "white"
//                         }
//                     });
//                     toast.success('Team created successfully!', {
//                         duration: 3000,
//                         position: 'top-right',
//                     });
                    
                   
//                         setShowCreateTeamModal(false);

                       
                        
//                         setTeamFormData({
//                             teamName: "",
//                             members: [
//                                 { role: "Team Lead", name: "", email: "", phone: "", gender: "" },
//                                 { role: "Member 1", name: "", email: "", phone: "", gender: "" },
//                                 { role: "Member 2", name: "", email: "", phone: "", gender: "" },
//                                 { role: "Member 3", name: "", email: "", phone: "", gender: "" },
//                             ],
//                         });
//                         allteams();
//                     }
//                 })
//                 .catch((error) => {
//                     // Dismiss loading toast and show error toast
//                     toast.dismiss(loadingToast);
//                     toast.error('Failed to create team. Please try again.', {
//                         duration: 4000,
//                         position: 'top-right',
//                     });
//                     console.error("Error creating team:", error);
//                 });
//         }
//     };

//     const tableVariants = {
//         hidden: { opacity: 0, x: -50 },
//         visible: { opacity: 1, x: 0, transition: { duration: 0.5 } },
//     };


//     const deleteteam = (team) => {
//         if (window.confirm("Confirm delete ?")) {
//             const del = toast.loading("Deleting team")

//             axios.post(`${URL}/delete_team`, { id: team.ID })
//                 .then(res => {
//                     allteams();
//                     toast.dismiss(del)
//                     toast.success("Team deleted")
//                 })
//                 .catch(error => {
//                     console.error("Error deleting team:", error);
//                     toast.error('Failed to delete team');
//                 });
//         }
//     }




//     return (
//         <div className="flex bg-gray-50 min-h-screen relative">
//             {/* Toast Container */}
//             <Toaster />



//             {/* ===== Main Content ===== */}
//             <div className="flex-1 m-30 mt-30">
//                 <AnimatePresence mode="wait">
//                     {!selectedTeam ?
//                         <motion.div
//                             key="team-list"
//                             variants={tableVariants}
//                             initial="hidden"
//                             animate="visible"
//                             exit="hidden"
//                             className="bg-white p-6 rounded-lg shadow-lg"
//                         >
//                             <div className="flex justify-between items-center mb-4 ">
//                                 <h2 className="text-xl font-semibold text-gray-800">
//                                     Team List
//                                 </h2>
//                                 <button
//                                     onClick={() => setShowCreateTeamModal(true)}
//                                     className="bg-[#fc8f00] text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors font-medium"
//                                 >
//                                     + Create Team
//                                 </button>
//                             </div>
//                             {!fetched ? <div className="rounded  bg-white shadow-sm p-8 text-center">
//                                 <svg
//                                     className="mx-auto h-8 w-8 animate-spin text-[#0f62fe]"
//                                     xmlns="http://www.w3.org/2000/svg"
//                                     fill="none"
//                                     viewBox="0 0 24 24"
//                                 >
//                                     <circle
//                                         className="opacity-25"
//                                         cx="12"
//                                         cy="12"
//                                         r="10"
//                                         stroke="currentColor"
//                                         strokeWidth="4"
//                                     />
//                                     <path
//                                         className="opacity-75"
//                                         fill="currentColor"
//                                         d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
//                                     />
//                                 </svg>
//                                 <div className="mt-3 text-sm text-[#4a4a4a]">Loading Teams...</div>
//                             </div> :

//                                 <div>{
//                                     FullTeam.length == 0 ? <p>No Teams created</p> : <table className="min-w-full border border-gray-200">
//                                         <thead className="bg-gray-100 border-b border-gray-200">
//                                             <tr>
//                                                 <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
//                                                     Team ID
//                                                 </th>
//                                                 <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
//                                                     Team Name
//                                                 </th>
//                                                 <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
//                                                     Lead Email
//                                                 </th>
//                                                 <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
//                                                     Lead Phone
//                                                 </th>
//                                                 <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider" >Edit</th>
//                                                 <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider" >Delete</th>

//                                             </tr>
//                                         </thead>
//                                         <tbody className="divide-y divide-gray-100">
//                                             {FullTeam.map((team) => (
//                                                 <tr
//                                                     key={team.ID}

//                                                     className="hover:bg-gray-50 cursor-pointer"
//                                                 >
//                                                     <td className="px-6 py-4 text-sm text-gray-700" onClick={() => SelectedTeam(team)}>{team.ID}</td>
//                                                     <td className="px-6 py-4 text-sm font-medium text-gray-900" onClick={() => SelectedTeam(team)}>
//                                                         {team.NAME}
//                                                     </td>
//                                                     <td className="px-6 py-4 text-sm text-gray-600" onClick={() => SelectedTeam(team)}>
//                                                         {team.LEAD_EMAIL}
//                                                     </td>
//                                                     <td className="px-6 py-4 text-sm text-gray-600" onClick={() => SelectedTeam(team)}>
//                                                         {team.LEAD_PHONE}
//                                                     </td>
//                                                     <td className="px-6 py-4 text-sm text-green-600  text-center ">
//                                                         <button onClick={() => handleEditMembers(team)}><FaRegEdit className="cursor-pointer" /></button>
//                                                     </td>
//                                                     <td className="px-6 py-4 text-sm text-red-600 text-center ">
//                                                         <button onClick={() => deleteteam(team)}> <IoTrashBinOutline className="cursor-pointer" /></button>
//                                                     </td>
//                                                 </tr>
//                                             ))}
//                                         </tbody>
//                                     </table>
//                                 } </div>
//                             }
//                         </motion.div>
//                         : ""}

//                 </AnimatePresence>
//             </div>

//             {/* ===== Modal ===== */}
//             {showCreateTeamModal && (
//                 <div className="fixed inset-0 backdrop-blur-sm bg-white/20 flex items-center justify-center z-50">
//                     <motion.div
//                         initial={{ opacity: 0, scale: 0.9 }}
//                         animate={{ opacity: 1, scale: 1 }}
//                         exit={{ opacity: 0, scale: 0.9 }}
//                         className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-4"
//                     >
//                         <div className="flex justify-between items-center mb-6">
//                             <h3 className="text-2xl font-bold text-gray-800">
//                                 {fetched_s ? "Create New Team" : "Modify Team"}
//                             </h3>
//                             <button
//                                 onClick={() => {
//                                     setShowCreateTeamModal(false), setfetched_s(true),
//                                         setTeamFormData({
//                                             teamName: "",
//                                             members: [
//                                                 { role: "Team Lead", name: "", email: "", phone: "", gender: "" },
//                                                 { role: "Member 1", name: "", email: "", phone: "", gender: "" },
//                                                 { role: "Member 2", name: "", email: "", phone: "", gender: "" },
//                                                 { role: "Member 3", name: "", email: "", phone: "", gender: "" },
//                                             ],
//                                         })
//                                 }}
//                                 className="text-gray-500 hover:text-gray-700 text-xl"
//                             >
//                                 ✕
//                             </button>
//                         </div>

//                         <form onSubmit={handleCreateTeam}>
//                             <div className="mb-6">
//                                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                                     Team Name
//                                 </label>
//                                 <input
//                                     type="text"
//                                     value={teamFormData.teamName}
//                                     onChange={(e) =>
//                                         setTeamFormData({ ...teamFormData, teamName: e.target.value })
//                                     }
//                                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#fc8f00]"
//                                     placeholder="Enter team name"
//                                     required
//                                 />
//                             </div>

//                             <div className="mb-6 border border-gray-200 rounded-lg p-4 bg-gray-50">
//                                 <h4 className="text-lg font-semibold text-gray-800 mb-4">Mentor Details</h4>

//                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                                 <div>
//                                     <label className="block text-sm font-medium text-gray-700 mb-1">
//                                     Mentor Name
//                                     </label>
//                                     <input
//                                     type="text"
//                                     value={mentorName}
//                                       onChange={(e) => handleMentorChange('mentorName', e.target.value)}
//                                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#fc8f00]"
//                                     placeholder="Enter mentor name"
//                                     required
//                                     />
//                                 </div>

                                

//                                 <div>
//                                     <label className="block text-sm font-medium text-gray-700 mb-1">
//                                     Email
//                                     </label>
//                                     <input
//                                     type="email"
//                                     value={mentorEmail}
//                                     onChange={(e) => handleMentorChange('mentorEmail', e.target.value)}
//                                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#fc8f00]"
//                                     placeholder="Enter email"
//                                     required
//                                     />
//                                 </div>

                               
//                                 </div>
//                             </div>

//                             <div className="mb-6">
//                                 <h4 className="text-lg font-semibold text-gray-800 mb-4">
//                                     Team Members
//                                 </h4>
//                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                                     {teamFormData.members.map((member, index) => (
//                                         <div
//                                             key={index}
//                                             className="border border-gray-200 rounded-lg p-4 bg-gray-50"
//                                         >
//                                             <h5 className="font-medium text-gray-700 mb-3">
//                                                 {member.role}
//                                             </h5>

//                                             <div className="space-y-3">
//                                                 <input
//                                                     type="text"
//                                                     value={member.name}
//                                                     onChange={(e) =>
//                                                         handleMemberChange(index, "name", e.target.value)
//                                                     }
//                                                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#fc8f00]"
//                                                     placeholder="Name"
//                                                     required
//                                                 />
//                                                 <input
//                                                     type="email"
//                                                     value={member.email}
//                                                     onChange={(e) =>
//                                                         handleMemberChange(index, "email", e.target.value)
//                                                     }
//                                                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#fc8f00]"
//                                                     placeholder="Email"
//                                                     required
//                                                 />
//                                                 <input
//                                                     type="tel"
//                                                     value={member.phone}
//                                                     onChange={(e) =>
//                                                         handleMemberChange(index, "phone", e.target.value)
//                                                     }
//                                                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#fc8f00]"
//                                                     placeholder="Phone"
//                                                     required
//                                                 />
//                                                 <select
//                                                     value={member.gender}
//                                                     onChange={(e) =>
//                                                         handleMemberChange(index, "gender", e.target.value)
//                                                     }
//                                                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#fc8f00]"
//                                                     required
//                                                 >
//                                                     <option value="">Select Gender</option>
//                                                     <option value="Male">Male</option>
//                                                     <option value="Female">Female</option>
//                                                     <option value="Other">Other</option>
//                                                 </select>
//                                             </div>
//                                         </div>
//                                     ))}
//                                 </div>
//                             </div>

//                             <div className="flex justify-end space-x-4">
//                                 <button
//                                     type="button"
//                                     onClick={() => {
//                                         setShowCreateTeamModal(false), setfetched_s(true),
//                                             setTeamFormData({
//                                                 teamName: "",
//                                                 members: [
//                                                     { role: "Team Lead", name: "", email: "", phone: "", gender: "" },
//                                                     { role: "Member 1", name: "", email: "", phone: "", gender: "" },
//                                                     { role: "Member 2", name: "", email: "", phone: "", gender: "" },
//                                                     { role: "Member 3", name: "", email: "", phone: "", gender: "" },
//                                                 ],
//                                             }), setteam_id(0)
//                                     }}
//                                     className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
//                                 >
//                                     Cancel
//                                 </button>
//                                 <button
//                                     type="submit"
//                                     className="px-6 py-2 bg-[#fc8f00] text-white rounded-lg hover:bg-orange-600 transition-colors"
//                                 >
//                                     {fetched_s ? "Create team" : "Update team"}
//                                 </button>
//                             </div>
//                         </form>
//                     </motion.div>
//                 </div>
//             )}
//         </div>
//     );
// }

// export default TeamList;

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { URL } from "../../Utils";
import Pagination, { usePagination } from "../../components/common/Pagination";
import ChangePasswordModal from "../../components/ChangePasswordModal";
import { FiKey } from "react-icons/fi";
import TeamImportPanel from "../../components/TeamImportPanel";

// A team is the team lead plus 1-4 members (2-5 people); the lead's email is the team's login
const MIN_TEAM = 2;
const MAX_TEAM = 5;
const roleFor = (i) => (i === 0 ? "Team Lead" : `Member ${i}`);
const newMember = (i) => ({ role: roleFor(i), name: "", email: "", phone: "", gender: "", gradYear: "" });
const emptyTeam = () => ({ teamName: "", members: [newMember(0), newMember(1)] });
const INTEREST_OPTIONS = [["software", "Software"], ["hardware", "Hardware"], ["combined", "Combined (Hardware + Software)"]];

// a member can graduate this year or up to ten years ahead (e.g. 2026-2036); the team leaves the SPOC list after its last member graduates
const GRAD_YEARS = Array.from({ length: 11 }, (_, i) => new Date().getFullYear() + i);
import { useNavigate } from "react-router-dom";
import { FaUsers } from "react-icons/fa";
import toast, { Toaster } from "react-hot-toast";
import { IoTrashBinOutline } from "react-icons/io5";
import { FaRegEdit } from "react-icons/fa";

// embedded: shown inside the SPOC dashboard, which already has its own toast area
function TeamList({ embedded = false }) {
  const [FullTeam, setFullTeam] = useState([]);
  const [passwordTeam, setPasswordTeam] = useState(null); // team whose login password is being changed
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

  const [teamFormData, setTeamFormData] = useState(emptyTeam);
  // email problems found when the form was submitted, by member position (shown under each email box)
  const [emailErrors, setEmailErrors] = useState({});
  const [checking, setChecking] = useState(false);
  const [showImport, setShowImport] = useState(false); // bulk team import from Excel

  const [mentorName, setMentorName] = useState("");
  // challenge categories the team is interested in (it is emailed only about these); at least one
  const [interests, setInterests] = useState([]);
  const toggleInterest = (key) => setInterests((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
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
    if (field === "email") setEmailErrors((prev) => { const next = { ...prev }; delete next[index]; return next; });
    setTeamFormData((prev) => ({
      ...prev,
      members: prev.members.map((member, i) =>
        i === index ? { ...member, [field]: value } : member
      ),
    }));
  };

  // add / remove member slots (2-5 people); roles are renumbered so they stay Member 1, 2, 3...
  const addMember = () => setTeamFormData((prev) => (
    prev.members.length >= MAX_TEAM ? prev : { ...prev, members: [...prev.members, newMember(prev.members.length)] }
  ));
  const removeMember = (index) => {
    setEmailErrors({});
    setTeamFormData((prev) => (
      prev.members.length <= MIN_TEAM || index === 0 ? prev
        : { ...prev, members: prev.members.filter((_, i) => i !== index).map((m, i) => ({ ...m, role: roleFor(i) })) }
    ));
  };

  // shows every problem email at once: a message under each box and one toast listing them all
  const showEmailIssues = (issues) => {
    setEmailErrors(Object.fromEntries(issues.map((i) => [i.index, i.message])));
    toast.error(
      (t) => (
        <div className="text-sm">
          <div className="font-semibold mb-1">Fix these emails before saving:</div>
          <ul className="list-disc pl-4 space-y-0.5">
            {issues.map((i) => <li key={i.index}><b>{i.email || "(empty)"}</b> ({i.role}): {i.message}</li>)}
          </ul>
          <button type="button" onClick={() => toast.dismiss(t.id)} className="mt-2 text-xs underline">Dismiss</button>
        </div>
      ),
      { duration: 10000, position: "top-center", id: "team-email-issues" }
    );
  };
  const failWith = (error, fallback) => {
    const issues = error.response?.data?.issues;
    if (Array.isArray(issues) && issues.length) showEmailIssues(issues);
    else toast.error(error.response?.data?.message || fallback);
  };

  const handleEditMembers = (e) => {
    axios.post(`${URL}/fetch_team_members`, { id: e.ID }).then((res) => {
      setteam_id(e.ID);
      setfetch_team_members(res.data);
      const rows = [...(res.data.result || [])].sort((a, b) => (a.ROLE === "Team Lead" ? -1 : b.ROLE === "Team Lead" ? 1 : a.ID - b.ID));
      const loaded = rows.slice(0, MAX_TEAM).map((m, i) => ({
        role: roleFor(i),
        name: m.NAME || "",
        email: m.EMAIL || "",
        phone: m.PHONE || "",
        gender: m.GENDER || "",
        gradYear: m.GRAD_YEAR ? String(m.GRAD_YEAR) : "",
      }));
      while (loaded.length < MIN_TEAM) loaded.push(newMember(loaded.length));
      setEmailErrors({});
      setTeamFormData({ teamName: e.NAME, members: loaded });
      setMentorEmail(res.data.mentor[0].MENTOR_EMAIL);
      setInterests(String(res.data.mentor[0].INTERESTS || "").split(",").filter(Boolean));
      setMentorName(res.data.mentor[0].MENTOR_NAME);
    });
    setShowCreateTeamModal(true);
    setfetched_s(false);
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (checking) return;
    if (interests.length === 0) {
      toast.error("Choose at least one interest: Software, Hardware or Combined");
      return;
    }

    // 1) check every email first (duplicates in this form, already in 2 teams, lead already used);
    //    nothing is saved and no mail is sent until all of them are fine
    setChecking(true);
    try {
      const res = await axios.post(`${URL}/check_team_members`, {
        members: teamFormData.members.map(({ email }) => ({ email })),
        teamId: fetched_s ? undefined : team_id,
      });
      if (res.data.issues?.length) {
        showEmailIssues(res.data.issues);
        return;
      }
      setEmailErrors({});
    } catch (error) {
      failWith(error, "Could not check the team details. Please try again.");
      return;
    } finally {
      setChecking(false);
    }

    if (!fetched_s) {
      let load = toast.loading("Updating team...");
      axios
        .post(`${URL}/update_team`, {
          team: teamFormData,
          id: team_id,
          mentorEmail: mentorEmail,
          mentorName: mentorName,
          interests,
        })
        .then((res) => {
          if (res.data == "Updated") {
            toast.dismiss(load);
            toast.success("Updated!");
            setShowCreateTeamModal(false);
            allteams();
          }
        })
        .catch((error) => {
          toast.dismiss(load);
          failWith(error, "Failed to update team. Please try again.");
        });
    } else {
      // one toast that changes from "creating" to the result (never left spinning)
      const toastId = toast.loading("Creating team and emailing the login details...");

      axios
        .post(`${URL}/add_members/${spoc_id}`, {
          Teamdata: teamFormData,
          mentorEmail: mentorEmail,
          mentorName: mentorName,
          interests,
        })
        .then((res) => {
          // the team lead's login is created by the server together with the team, and emailed to the lead
          if (res.status === 200) {
            toast.success("Team created. The login details are being emailed to the team lead.", { id: toastId, duration: 4000 });

            setShowCreateTeamModal(false);
            setTeamFormData(emptyTeam());
            setEmailErrors({});
            setInterests([]);
            allteams();
          }
        })
        .catch((error) => {
          toast.dismiss(toastId);
          failWith(error, "Failed to create team. Please try again.");
          console.error("Error creating team:", error);
        });
    }
  };

  const tableVariants = {
    hidden: { opacity: 0, x: -30 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.4 } },
  };

  const deleteteam = (team) => {
    if (window.confirm(`Remove team "${team.NAME}"? It disappears from your list and its login is closed. If the team has submitted a solution, the organisers keep its records.`)) {
      const del = toast.loading("Deleting team...");
      axios
        .post(`${URL}/delete_team`, { id: team.ID })
        .then((res) => {
          allteams();
          toast.success(res.data?.archived ? "Team removed. Its submissions stay on record for the organisers." : "Team deleted", { id: del });
        })
        .catch((error) => {
          toast.error(error.response?.data?.message || "Failed to delete team", { id: del });
        });
    }
  };


  const { page, setPage, pageItems: pagedTeams, total, totalPages } = usePagination(FullTeam);

  return (
    <div className="min-h-screen bg-gray-50">
      {!embedded && <Toaster position="top-right" />}

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

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowImport(true)}
              className="inline-flex items-center justify-center px-4 sm:px-5 py-2 rounded-lg border border-[#fc8f00] text-[#fc8f00] text-sm font-medium hover:bg-orange-50 transition-colors"
            >
              Import from Excel
            </button>
            <button
              onClick={() => setShowCreateTeamModal(true)}
              className="inline-flex items-center justify-center px-4 sm:px-5 py-2 rounded-lg bg-[#fc8f00] text-white text-sm font-medium shadow-sm hover:bg-orange-600 transition-colors"
            >
              + Create Team
            </button>
          </div>
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
                          <th className="px-4 sm:px-6 py-3 text-left text-[11px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Interests
                          </th>
                          <th className="px-4 sm:px-6 py-3 text-center text-[11px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Edit
                          </th>
                          <th className="px-4 sm:px-6 py-3 text-center text-[11px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Password
                          </th>
                          <th className="px-4 sm:px-6 py-3 text-center text-[11px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Delete
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {pagedTeams.map((team) => (
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
                            <td className="px-4 sm:px-6 py-3 text-gray-600" onClick={() => SelectedTeam(team)}>
                              {team.INTERESTS
                                ? String(team.INTERESTS).split(",").map((k) => <span key={k} className="inline-block mr-1 mb-1 px-2 py-0.5 rounded-full bg-orange-50 text-[#c76f00] text-xs font-medium capitalize">{k}</span>)
                                : <span className="text-xs text-gray-400" title="Gets emails about every new challenge until interests are set">Not set</span>}
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
                                onClick={() => setPasswordTeam(team)}
                                className="inline-flex items-center justify-center rounded-full p-2 bg-orange-50 hover:bg-orange-100 text-[#fc8f00] transition"
                                title="Change the team's login password"
                              >
                                <FiKey />
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
                    <div className="px-4">
                      <Pagination page={page} totalPages={totalPages} total={total} onChange={setPage} label="teams" />
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {passwordTeam && (
        <ChangePasswordModal
          title="Change team login password"
          subtitle={`${passwordTeam.NAME} · login ${passwordTeam.LEAD_EMAIL}`}
          emailLabel="Email the new password to the team lead"
          onSave={async (password, emailUser) => {
            await axios.post(`${URL}/team_password`, { teamId: passwordTeam.ID, password, emailUser }, { withCredentials: true });
            toast.success(`Password changed for ${passwordTeam.NAME}${emailUser ? " and emailed to the team lead" : ""}`);
            setPasswordTeam(null);
          }}
          onClose={() => setPasswordTeam(null)}
        />
      )}

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
                  setTeamFormData(emptyTeam());
            setEmailErrors({});
            setInterests([]);
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

              {/* Interests: the team is emailed only about new challenges in these categories */}
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h4 className="text-base sm:text-lg font-semibold text-gray-800">
                  Interests <span className="text-red-500">*</span>
                </h4>
                <p className="text-xs text-gray-500 mb-3">Choose one or more. The team gets emails only about new challenges in these categories.</p>
                <div className="flex flex-wrap gap-2">
                  {INTEREST_OPTIONS.map(([key, label]) => {
                    const on = interests.includes(key);
                    return (
                      <button
                        type="button"
                        key={key}
                        onClick={() => toggleInterest(key)}
                        aria-pressed={on}
                        className={`px-4 py-2 rounded-full text-sm font-medium border transition ${on ? "bg-[#fc8f00] border-[#fc8f00] text-white" : "bg-white border-gray-300 text-gray-700 hover:border-[#fc8f00]"}`}
                      >
                        {on ? "✓ " : ""}{label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Team Members */}
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <h4 className="text-base sm:text-lg font-semibold text-gray-800">
                    Team Members{" "}
                    <span className="text-sm font-normal text-gray-500">
                      ({teamFormData.members.length} of {MAX_TEAM} · minimum {MIN_TEAM}, including the team lead)
                    </span>
                  </h4>
                  {teamFormData.members.length < MAX_TEAM && (
                    <button type="button" onClick={addMember} className="px-3 py-1.5 rounded-lg border border-[#fc8f00] text-[#fc8f00] text-sm font-medium hover:bg-orange-50">
                      + Add member
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {teamFormData.members.map((member, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-medium text-gray-700 text-sm">
                          {member.role}
                          {index === 0 && <span className="ml-2 text-xs font-normal text-gray-500">(email is the team login)</span>}
                        </h5>
                        {index > 0 && teamFormData.members.length > MIN_TEAM && (
                          <button type="button" onClick={() => removeMember(index)} className="text-xs font-medium text-red-600 hover:underline">
                            Remove
                          </button>
                        )}
                      </div>
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
                        <div>
                          <input
                            type="email"
                            value={member.email}
                            onChange={(e) =>
                              handleMemberChange(index, "email", e.target.value)
                            }
                            aria-invalid={Boolean(emailErrors[index])}
                            className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 ${emailErrors[index] ? "border-red-500 bg-red-50 focus:ring-red-300" : "border-gray-300 focus:ring-[#fc8f00]"}`}
                            placeholder="Email"
                            required
                          />
                          {emailErrors[index] && (
                            <p className="mt-1 text-xs text-red-600">{emailErrors[index]}</p>
                          )}
                        </div>
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
                        <select
                          value={member.gradYear}
                          onChange={(e) =>
                            handleMemberChange(index, "gradYear", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#fc8f00]"
                          required
                        >
                          <option value="">Graduation year</option>
                          {GRAD_YEARS.map((year) => (
                            <option key={year} value={year}>{year}</option>
                          ))}
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
                    setTeamFormData(emptyTeam());
            setEmailErrors({});
            setInterests([]);
                    setteam_id(0);
                  }}
                  className="px-5 py-2 border border-gray-300 text-sm text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={checking}
                  className="px-6 py-2 bg-[#fc8f00] text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-60"
                >
                  {checking ? "Checking details…" : fetched_s ? "Create team" : "Update team"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
      {/* Bulk team import from the Excel template */}
      {showImport && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto" onClick={() => setShowImport(false)}>
          <div className="bg-gray-50 rounded-2xl shadow-2xl w-full max-w-5xl my-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3 px-6 py-4 border-b border-gray-200 bg-white rounded-t-2xl">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Import teams from Excel</h3>
                <p className="text-xs text-gray-500 mt-1">Create many teams at once. The file is checked first; nothing is saved until you confirm.</p>
              </div>
              <button onClick={() => setShowImport(false)} className="text-gray-500 hover:text-gray-700 text-xl" aria-label="Close">✕</button>
            </div>
            <div className="p-6">
              <TeamImportPanel onDone={(r) => { allteams(); toast.success(`${r.summary.imported} team(s) created`); }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeamList;
