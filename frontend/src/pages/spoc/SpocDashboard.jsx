import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaUsers, FaClipboardList, FaUser } from 'react-icons/fa';
import { AiOutlineTeam } from "react-icons/ai";
import { RiTeamFill } from "react-icons/ri";
import ProblemStatements from "../../components/ProblemStatements";
import SPOCProfile from './SPOCProfile';
import TeamList from './TeamList';
import axios from 'axios';
import { URL } from '../../Utils';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import Header from '../../components/Header';
// import Footer from '../../components/Footer';

const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: FaUsers },
    { id: 'problems', label: 'Problems', icon: FaClipboardList },
    { id: 'teamdetails', label: 'Team Details', icon: RiTeamFill },
    { id: 'profile', label: 'Profile', icon: FaUser },
];

const NavItem = ({ item, activeView, onClick }) => {
    const Icon = item.icon;
    const isActive = activeView === item.id;
    return (
        <li className="mb-2">
            <button
                onClick={() => onClick(item.id)}
                className={`w-full flex items-center p-2 text-base font-normal text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-400 transition ${isActive ? 'bg-gray-700' : ''}`}
                aria-current={isActive ? 'page' : undefined}
                aria-pressed={isActive}
            >
                <Icon className="mr-3" />
                <span>{item.label}</span>
            </button>
        </li>
    );
};

const SpocDashboard = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const [activeView, setActiveView] = useState('dashboard');
    const teamsPerPage = 10;
    const navigate = useNavigate();
    const [data, setData] = useState([]);// expected to be an array of teams
    const [spoc_data, setSpoc_data] = useState([]);


    const handlelogout = async () => {
        try {
            axios.defaults.withCredentials = true;
            const res = await axios.get(`${URL}/logout`);
         
            navigate('/');
        } catch (error) {
            console.error(error);
            toast.error('Logout failed');
        }
    };

    useEffect(() => {
        const fetch = async () => {
            try {
                axios.defaults.withCredentials = true;
                const res = await axios.get(`${URL}/cookie`);
                if (res.data?.message === 'jwt must be provided') {
                    toast.error('Please login');
                    navigate('/');
                    return;
                }

                const ID = res.data?.ID;
                if (!ID) {
                    toast.error('Invalid session data');
                    return;
                }

                const teamsRes = await axios.post(`${URL}/fetch_teams/${ID}`, { ID });
                if (teamsRes.data?.message === 'No teams found for this SPOC') {
                    toast.error('No teams found for this SPOC');
                    setData([]);
                } else {
                    // assume teamsRes.data is an array of teams
                    setData(Array.isArray(teamsRes.data) ? teamsRes.data : []);
                }
            } catch (err) {
                console.error(err);
                toast.error('Failed to fetch teams');
            }
        };

        fetch();
    }, [navigate]);

    const totalTeams = data.length;
   
    const indexOfLastTeam = currentPage * teamsPerPage;
    const indexOfFirstTeam = indexOfLastTeam - teamsPerPage;
    const currentTeams = data.slice(indexOfFirstTeam, indexOfLastTeam);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const pageNumbers = [];
    for (let i = 1; i <= Math.max(1, Math.ceil(totalTeams / teamsPerPage)); i++) {
        pageNumbers.push(i);
    }

    const cardVariants = {
        hidden: { opacity: 0, y: 50 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
    };

    const tableVariants = {
        hidden: { opacity: 0, x: -50 },
        visible: { opacity: 1, x: 0, transition: { duration: 0.5, delay: 0.2 } }
    };

    const getCollegeName = () => {
        axios.get(`${URL}/cookie`).then(res => { setSpoc_data(res.data) });
        
        // try to infer college from first team if present
        
        return spoc_data?.COLLEGE || spoc_data?.college || 'KIOT';
    };

    const getTeamName = (team, fallbackIndex) =>
        team?.NAME || team?.name || `Team ${fallbackIndex}`;

    const getTeamLeader = (team) =>
        team?.LEAD_EMAIL || team?.email || team?.LEADER || team?.leader || '—';

    const isSubmitted = (team) => {
        const s = team?.submitted ?? team?.SUBMITTED ?? team?.isSubmitted ?? team?.IS_SUBMITTED;
        return s === true || s === 'Submitted' || s === 1 || s === '1';
    };

    return (
        <>
            <div className="flex flex-col min-h-screen bg-gray-100">
                <Toaster position="top-right" />
                <Header />
                <div className="flex flex-1 pt-20">
                    {/* Sidebar */}
                <aside className="w-56 bg-[#494949] text-white p-6 sticky top-20 h-[calc(100vh-5rem)]">
                    <nav aria-label="Main navigation">
                        <ul className="mt-2">
                            {navItems.map(item => (
                                <NavItem key={item.id} item={item} activeView={activeView} onClick={setActiveView} />
                            ))}
                        </ul>
                    </nav>

                    {/* <div className="absolute bottom-16 left-6 right-6">
                        <p className="text-sm mb-2 truncate">{getCollegeName()}</p>
                        <button
                            onClick={handlelogout}
                            className="w-full cursor-pointer py-2 px-2 rounded-sm mb-2 font-semibold bg-white text-black transition duration-300 ease-in-out hover:bg-red-500 hover:text-white"
                        >
                            LOGOUT
                        </button>
                    </div> */}
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-10">
                    {activeView === 'dashboard' && (
                        <>
                            <h1 className="text-3xl font-bold mb-8 text-gray-800">SPOC Dashboard</h1>
                            <p className="my-2 p-3 bg-white rounded-lg shadow-lg font-bold text-center">
                                College - {getCollegeName().replace ? getCollegeName().replace(/([A-Z])/g, " $1").trim() : getCollegeName()}
                            </p>

                            {/* Stats Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                                <motion.div
                                    className="bg-white p-6 rounded-lg shadow-lg"
                                    variants={cardVariants}
                                    initial="hidden"
                                    animate="visible"
                                >
                                    <h2 className="text-xl font-semibold text-gray-700 mb-2">Total Teams</h2>
                                    <p className="text-4xl font-bold text-[#fc8f00]">{totalTeams}</p>
                                </motion.div>
                                <motion.div
                                    className="bg-white p-6 rounded-lg shadow-lg"
                                    variants={cardVariants}
                                    initial="hidden"
                                    animate="visible"
                                >
                                    <h2 className="text-xl font-semibold text-gray-700 mb-2">Total Teams Submitted</h2>
                                    <p className="text-4xl font-bold text-[#fc8f00]">
                                        {data.filter(isSubmitted).length}
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
                                <h2 className="text-xl font-semibold text-gray-700 mb-4">Teams List</h2>
                                <table className="min-w-full bg-white">
                                    <thead>
                                        <tr>
                                            <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Team Name</th>
                                            <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Leader Email</th>
                                            <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Leader Phone</th>
                                            <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentTeams.map((team, idx) => {
                                            const name = getTeamName(team, indexOfFirstTeam + idx + 1);
                                            const leader = getTeamLeader(team);
                                            const submitted = isSubmitted(team);
                                            const key = team.id || team._id || indexOfFirstTeam + idx;
                                            return (
                                                <tr key={key}>
                                                    <td className="py-2 px-4 border-b border-gray-200">{name}</td>
                                                    <td className="py-2 px-4 border-b border-gray-200">{leader}</td>
                                                    <td className="py-2 px-4 border-b border-gray-200">{team?.LEAD_PHONE || team?.phone || team?.PHONE || '—'}</td>
                                                    <td className="py-2 px-4 border-b border-gray-200">
                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${submitted ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                            {submitted ? 'Submitted' : 'Not Submitted'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {currentTeams.length === 0 && (
                                            <tr>
                                                <td className="py-4 px-4 border-b border-gray-200" colSpan="3">No teams to display</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>

                                {/* Pagination */}
                                <div className="py-3 flex justify-center">
                                    <nav className="block" aria-label="Pagination">
                                        <ul className="flex pl-0 rounded list-none flex-wrap">
                                                                        {pageNumbers.map((number) => (
                                                                            <li key={number}>
                                                                                <a
                                                                                    onClick={(e) => {
                                                                                        e.preventDefault();
                                                                                        paginate(number);
                                                                                    }}
                                                                                    href="#"
                                                                                    className={`first:ml-0 text-xs font-semibold flex w-8 h-8 mx-1 p-0 items-center justify-center leading-tight relative border border-solid border-gray-300 rounded-full ${currentPage === number ? 'bg-[#fc8f00] text-white' : 'text-gray-800'}`}
                                                                                    aria-current={currentPage === number ? 'page' : undefined}
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
                    {activeView === 'problems' && <ProblemStatements />}
                    {activeView === 'teamdetails' && <TeamList data={data} />}
                    {activeView === 'profile' && <SPOCProfile />}
                </main>
            </div>
            {/* <Footer /> */}
        </div>
    </>
);
};
export default SpocDashboard;
