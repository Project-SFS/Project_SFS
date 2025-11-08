// src/pages/admin/ProblemStatementsList.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiFilter, FiUsers, FiFileText, FiPlus, FiUpload } from 'react-icons/fi';
import { mockProblemStatements, getEvaluatorUsers, getSubmissionsByProblemId, mockSubmissions } from '../../mockData';
import Breadcrumb from '../../components/common/Breadcrumb';
import Button from '../../components/common/Button';

const ProblemStatementsList = () => {
  const navigate = useNavigate();
  const evaluators = getEvaluatorUsers();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');

  const handleProblemClick = (problem) => {
    navigate(`/admin/problems/${problem.id}/details`);
  };

  const getEvaluatorForProblem = (problem) => {
    const evaluatorId = (problem.assignedEvaluators && problem.assignedEvaluators.length > 0)
      ? problem.assignedEvaluators[0]
      : 'E0001'; // Default fallback
    return evaluators.find(e => e.id === evaluatorId) || null;
  };

  const getEvaluatedCount = (problemId) => {
    const submissions = getSubmissionsByProblemId(problemId);
    return submissions.filter(sub => sub.status === 'Evaluated').length;
  };

  const formatDateTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString();
  };

  const filteredData = mockProblemStatements
    .filter(problem => {
      const matchesSearch = problem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        problem.id.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    })
    .sort((a, b) => {
      if (sortOrder === 'newest') return new Date(b.created) - new Date(a.created);
      if (sortOrder === 'oldest') return new Date(a.created) - new Date(b.created);
      const countA = a.submissionsCount || 1;
      const countB = b.submissionsCount || 1;
      return sortOrder === 'asc' ? countA - countB : countB - a;
    });

  return (
    <div className="min-h-screen bg-[#F7F8FC] py-10 px-8 transition-all duration-300">
      <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-sm p-10 border border-[#E2E8F0]">
        <Breadcrumb />

        {/* Header */}
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-semibold text-[#1A202C] mb-1">
              Problem Statements
            </h1>
            <p className="text-[#718096] text-sm">
              Manage, filter, and review submitted problem statements.
            </p>
          </div>

          <button
            onClick={() => navigate('/admin/problems/create')}
            className="flex items-center gap-2 bg-[#FF9900] hover:bg-[#e68900] text-white px-5 py-2.5 rounded-xl shadow-md transition-all"
          >
            <FiPlus className="text-lg" />
            Create Problem Statement
          </button>
        </div>

        {/* Summary Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
          <div className="bg-white shadow-sm border border-[#E2E8F0] rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <FiFileText className="text-[#FF9900] text-2xl" />
              <div>
                <h2 className="text-[#4A5568] font-medium text-base">
                  Total Problem Statements
                </h2>
                <p className="text-2xl font-semibold text-[#1A202C]">{mockProblemStatements.length}</p>
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
                <p className="text-2xl font-semibold text-[#1A202C]">{new Set(mockSubmissions.map(s => s.teamId)).size}</p>
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
                <p className="text-2xl font-semibold text-[#1A202C]">{mockSubmissions.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-5 mb-8">
          <div className="relative w-full md:w-2/3">
            <input
              type="text"
              placeholder="Search by ID or Title"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-5 py-2.5 text-base border border-[#E2E8F0] rounded-xl focus:ring-2 focus:ring-[#FF9900] focus:outline-none transition-all placeholder-[#A0AEC0]"
            />
            <FiSearch className="absolute right-4 top-3 text-[#A0AEC0]" />
          </div>

          <div className="flex items-center gap-3">
            <label className="text-[#4A5568] font-medium text-base">Filter:</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="px-4 py-2 border border-[#E2E8F0] rounded-xl text-base focus:ring-2 focus:ring-[#FF9900] focus:outline-none transition-all"
            >
              <option value="asc">Low to High</option>
              <option value="desc">High to Low</option>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto bg-white rounded-2xl border border-[#E2E8F0]">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#F7F8FC] text-[#4A5568]">
              <tr>
                <th className="p-4 font-semibold">PS ID</th>
                <th className="p-4 font-semibold">Problem Statement</th>
                <th className="p-4 text-center font-semibold">Evaluator ID</th>
                <th className="p-4 text-center font-semibold">Evaluator Phone</th>
                <th className="p-4 text-center font-semibold">Submissions</th>
                <th className="p-4 text-center font-semibold">Created</th>
                <th className="p-4 text-center font-semibold">Evaluated</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((problem) => {
                const evaluator = getEvaluatorForProblem(problem);
                return (
                  <tr
                    key={problem.id}
                    className="hover:bg-[#F9FAFB] border-t border-[#E2E8F0] transition-all"
                  >
                    <td className="p-4 text-[#1A202C] font-medium">{problem.id}</td>
                    <td className="p-4">
                      <span
                        className="text-[#2B6CB0] hover:underline cursor-pointer"
                        onClick={() => handleProblemClick(problem)}
                      >
                        {problem.title}
                      </span>
                    </td>
                    <td className="p-4 text-center text-[#1A202C]">
                      {evaluator ? evaluator.id : 'N/A'}
                    </td>
                    <td className="p-4 text-center text-[#1A202C]">
                      {evaluator ? evaluator.phone : 'N/A'}
                    </td>
                    <td className="p-4 text-center text-[#1A202C]">
                      {problem.submissionsCount || 1}
                    </td>
                    <td className="p-4 text-center text-[#718096]">
                      {formatDateTime(problem.created)}
                    </td>
                    <td className="p-4 text-center text-[#1A202C]">
                      {getEvaluatedCount(problem.id) > 0 ? '✅' : '⏳'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProblemStatementsList;