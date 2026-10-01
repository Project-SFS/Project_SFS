/**
 * @file ProblemStatementsList.jsx
 * @description A page for admins to view and manage all problem statements on the platform.
 */
// src/pages/admin/ProblemStatementsList.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiFilter, FiUsers, FiFileText, FiPlus, FiUpload } from 'react-icons/fi';
import Breadcrumb from '../../components/common/Breadcrumb';
import Button from '../../components/common/button';
import Pagination, { usePagination } from '../../components/common/Pagination';
import { URL } from '../../Utils';

const ProblemStatementsList = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [sortOrder, setSortOrder] = useState('newest');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const handleProblemClick = (problem) => {
    // Navigates to the details page using the ID (e.g., /admin/problems/7/details)
    navigate(`/admin/problems/${problem.id}/details`);
  };

  // evaluated submissions of a problem, counted by the backend
  const getEvaluatedCount = (problemId) => problems.find(p => p.id === String(problemId))?.evaluatedCount ?? 0;

  const formatDateTime = (isoString) =>
    isoString ? new Date(isoString).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Not recorded';

  let json;

  useEffect(() => {
    const fetchProblems = async () => {
      setLoading(true);
      setError(null);
      try {
        const base = import.meta.env.VITE_API_URL || '';
        const res = await fetch(`${URL}/get_problems`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
         json = await res.json();

        let problemsData = [];
        if (Array.isArray(json)) {
          problemsData = json;
        } else if (json.problems && Array.isArray(json.problems)) {
          problemsData = json.problems;
        } else if (json.data && Array.isArray(json.data)) {
          problemsData = json.data;
        }

        json = json.problems
        
        

        const mapped = problemsData.map(p => ({
          id: p.ID ? String(p.ID) : (p.id ? String(p.id) : ''),
          title: p.TITLE || p.title || 'Untitled',
          description: p.DESCRIPTION || p.description || '',
          created: p.CREATED_AT || null,
          createdBy: p.created_by_email || p.created_by_name || (p.CREATED_BY ? 'Deleted user' : null),
          deadline: p.SUB_DEADLINE || p.deadline,
          submissionsCount: p.submission_count ?? p.submissionsCount ?? 0,
          evaluatedCount: p.evaluated_count ?? 0
        })).filter(p => p.id && p.id !== ''); 
        
        setProblems(mapped);
      } catch (err) {
        setError(err.message || 'Failed to fetch');
        setProblems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProblems();
  }, []);



  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const base = import.meta.env.VITE_API_URL || '';
        const res = await fetch(`${URL}/submissions?limit=1000`, { credentials: 'include' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        
        const mapped = (json?.submissions || []).map(s => ({
          id: s.ID ? String(s.ID) : (s.id || ''),
          problemId: s.PROBLEM_ID ?? s.PROBLEMID ?? s.problemId ?? s.problem_id ?? null,
          teamId: s.TEAM_EMAIL ?? s.TEAM_ID ?? s.teamId ?? s.team_id ?? null,
          status: String(s.STATUS ?? s.SUB_STATUS ?? s.Sub_status ?? s.sub_status ?? s.status ?? '').trim(),
          submittedDate: s.SUB_DATE ?? s.submittedDate ?? s.submitted_date ?? null,
        }));
        setSubmissions(mapped);
      } catch (err) {
        setSubmissions([]);
      }
    };

    fetchSubmissions();
  }, []);

  const dataSource = problems;

  const totalSubmissions = (submissions && submissions.length > 0) ? submissions.length : 0;
  const totalTeams = (submissions && submissions.length > 0)
    ? new Set(submissions.map(s => String(s.teamId))).size
    : 0;
  
  
  const filteredData = dataSource
    .filter(problem => {
      const matchesSearch = problem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        problem.id.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;

      // one submission is enough to count as "has submissions"
      if (statusFilter === 'with-submissions') return problem.submissionsCount > 0;
      if (statusFilter === 'no-submissions') return problem.submissionsCount === 0;
      if (statusFilter === 'evaluated') return getEvaluatedCount(problem.id) > 0;
      if (statusFilter === 'awaiting') return problem.submissionsCount > getEvaluatedCount(problem.id);
      return true;
    })
    .sort((a, b) => {
      // problems from before creation times were recorded fall back to their ID order
      if (sortOrder === 'newest') return (new Date(b.created || 0) - new Date(a.created || 0)) || (Number(b.id) - Number(a.id));
      if (sortOrder === 'oldest') return (new Date(a.created || 0) - new Date(b.created || 0)) || (Number(a.id) - Number(b.id));
      return 0;
    });

  const { page, setPage, pageItems, total, totalPages } = usePagination(filteredData, { resetKey: `${searchTerm}|${statusFilter}|${sortOrder}` });

  return (
    <div className="min-h-screen bg-[#F7F8FC] px-6 py-8 transition-all duration-300">
      <div className="mb-6">
        <Breadcrumb />
      </div>

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-[#1A202C] mb-1">
            Problem Statements
          </h1>
          <p className="text-[#718096] text-sm">
            Manage, filter, and review submitted problem statements.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate('/admin/problems/import')}
            className="flex items-center gap-2 bg-white border border-[#FF9900] text-[#FF9900] hover:bg-[#FF9900] hover:text-white px-5 py-2.5 rounded-xl shadow-sm transition-all"
          >
            <FiUpload className="text-lg" />
            Import from Excel
          </button>
          <button
            onClick={() => navigate('/admin/problems/create')}
            className="flex items-center gap-2 bg-[#FF9900] hover:bg-[#e68900] text-white px-5 py-2.5 rounded-xl shadow-md transition-all"
          >
            <FiPlus className="text-lg" />
            Create Problem Statement
          </button>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
        <div className="bg-white shadow-sm border border-[#E2E8F0] rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <FiFileText className="text-[#FF9900] text-2xl" />
            <div>
              <h2 className="text-[#4A5568] font-medium text-base">
                Total Problem Statements
              </h2>
              <p className="text-2xl font-semibold text-[#1A202C]">{problems.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-sm border border-[#E2E8F0] rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <FiUsers className="text-[#48BB78] text-2xl" />
            <div>
              <h2 className="text-[#4A5568] font-medium text-base">
                Total Teams
              </h2>
              <p className="text-2xl font-semibold text-[#1A202C]">{totalTeams}</p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-sm border border-[#E2E8F0] rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <FiUpload className="text-[#3182CE] text-2xl" />
            <div>
              <h2 className="text-[#4A5568] font-medium text-base">
                Total Submissions
              </h2>
              <p className="text-2xl font-semibold text-[#1A202C]">{totalSubmissions}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-5 mb-6">
        <div className="relative w-full md:w-2/3">
          <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
          <input
            type="text"
            placeholder="Search by ID or Title"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-[#E2E8F0] rounded-xl text-base shadow-sm focus:ring-2 focus:ring-[#FF9900] focus:outline-none transition-all placeholder-gray-400"
          />
        </div>

        <div className="flex items-center gap-3">
          <label className="text-[#4A5568] font-medium text-base">Filter:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-[#E2E8F0] rounded-xl text-base focus:ring-2 focus:ring-[#FF9900] focus:outline-none transition-all"
          >
            <option value="all">All problem statements</option>
            <option value="with-submissions">Has submissions</option>
            <option value="no-submissions">No submissions</option>
            <option value="evaluated">Has evaluated solutions</option>
            <option value="awaiting">Has solutions awaiting evaluation</option>
          </select>

          <label className="text-[#4A5568] font-medium text-base">Sort:</label>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="px-4 py-2 border border-[#E2E8F0] rounded-xl text-base focus:ring-2 focus:ring-[#FF9900] focus:outline-none transition-all"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-2xl border border-[#E2E8F0] shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#F7F8FC] text-[#4A5568]">
            <tr>
              <th className="p-4 font-semibold">PS ID</th>
              <th className="p-4 font-semibold">Problem Statement</th>
              <th className="p-4 text-center font-semibold">Submissions</th>
              <th className="p-4 text-center font-semibold">Evaluated</th>
              <th className="p-4 font-semibold">Created By</th>
              <th className="p-4 text-center font-semibold">Created</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="p-8 text-center">
                  <div className="flex justify-center items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#FF9900]"></div>
                  </div>
                </td>
              </tr>
            ) : filteredData.length > 0 ? (
                pageItems.map((problem) => {
                return (
                  <tr
                    key={problem.id}
                    className="hover:bg-[#F9FAFB] border-t border-[#E2E8F0] transition-all"
                  >
                    {/* UPDATED: Added onClick to the ID cell */}
                    <td 
                      className="p-4 text-[#1A202C] font-medium cursor-pointer hover:text-[#2B6CB0] transition-colors"
                      onClick={() => handleProblemClick(problem)}
                    >
                      SFS_{problem.id}
                    </td>
                    <td className="p-4">
                      <span
                        className="text-[#2B6CB0] hover:underline cursor-pointer"
                        onClick={() => handleProblemClick(problem)}
                      >
                        {problem.title}
                      </span>
                    </td>
                    <td className="p-4 text-center text-[#1A202C]">
                      {problem.submissionsCount}
                    </td>
                    <td className="p-4 text-center text-[#1A202C]">
                      {problem.evaluatedCount} / {problem.submissionsCount}
                    </td>
                    
                    <td className="p-4 text-[#1A202C]">
                      {problem.createdBy || <span className="text-[#A0AEC0]">Not recorded</span>}
                    </td>
                    <td className="p-4 text-center text-[#718096]">
                      {formatDateTime(problem.created)}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="6" className="p-8 text-center text-gray-500">
                  No problem statements found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={totalPages} total={total} onChange={setPage} label="problem statements" />
    </div>
  );
};

export default ProblemStatementsList;