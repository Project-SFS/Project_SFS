import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';
import Breadcrumb from '../../components/common/Breadcrumb';
import { getProblemStatementById, getSubmissionsByProblemId } from '../../mockData';
import { FiSearch, FiFilter, FiUsers, FiFileText, FiArrowLeft } from 'react-icons/fi';

const ProblemStatementDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const problem = getProblemStatementById(id);
  const submissions = getSubmissionsByProblemId(id);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOptions, setFilterOptions] = useState({
    evaluated: false,
    submitted: false,
  });
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  if (!problem) {
    return <div className="min-h-screen bg-gray-50 py-10"><div className="max-w-4xl mx-auto bg-white shadow rounded-lg p-8"><h1>Problem Statement not found</h1></div></div>;
  }

  const filteredSubmissions = submissions.filter(sub => {
    const matchesSearch = sub.spocId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = (!filterOptions.evaluated && !filterOptions.submitted) ||
      (filterOptions.evaluated && sub.status === 'Evaluated') ||
      (filterOptions.submitted && sub.status === 'Submitted');
    return matchesSearch && matchesFilter;
  });

  const teamsEnrolled = new Set(submissions.map(s => s.teamId)).size;
  const totalSubmissions = submissions.length;

  return (
    <div className="min-h-screen bg-[#F7F8FC] py-10 px-8 transition-all duration-300">
      <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-sm p-10 border border-[#E2E8F0]">
        <div className="flex justify-between items-center mb-6">
          <Breadcrumb />
          <Button
            onClick={() => navigate(-1)}
            className="bg-[#FF9900] hover:bg-[#e68900] text-white px-4 py-2 rounded-xl flex items-center space-x-2 font-medium shadow-sm hover:shadow-md transition-all duration-200"
          >
            <FiArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </Button>
        </div>
        {/* Problem Statement Information Table */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-[#1A202C]">Problem Statement Information</h2>
          <table className="w-full text-left border-collapse border border-[#E2E8F0] rounded-xl overflow-hidden">
            <tbody>
              <tr className="border-b border-[#E2E8F0]">
                <td className="p-4 font-medium bg-[#FF9900]/5 w-1/3 text-[#1A202C]">Problem Statement ID</td>
                <td className="p-4 text-[#1A202C]">{problem.id}</td>
              </tr>
              <tr className="border-b border-[#E2E8F0]">
                <td className="p-4 font-medium bg-[#FF9900]/5 text-[#1A202C]">Problem Statement Title</td>
                <td className="p-4 text-[#1A202C]">{problem.title}</td>
              </tr>
              <tr className="border-b border-[#E2E8F0]">
                <td className="p-4 font-medium bg-[#FF9900]/5 text-[#1A202C]">Description</td>
                <td className="p-4 text-[#1A202C]">{problem.description}</td>
              </tr>
              <tr className="border-b border-[#E2E8F0]">
                <td className="p-4 font-medium bg-[#FF9900]/5 text-[#1A202C]">YouTube Link</td>
                <td className="p-4 text-[#1A202C]">{problem.youtube || 'N/A'}</td>
              </tr>
              <tr>
                <td className="p-4 font-medium bg-[#FF9900]/5 text-[#1A202C]">Dataset Link</td>
                <td className="p-4 text-[#1A202C]">{problem.dataset || 'N/A'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Statistics Section */}
        <div className="flex items-center space-x-10 mb-6">
          <div className="flex items-center space-x-2">
            <FiUsers className="w-6 h-6 text-[#FF9900]" />
            <span className="font-medium text-[#1A202C]">No. of Teams Enrolled :</span>
            <input
              type="text"
              value={teamsEnrolled}
              readOnly
              className="w-16 border border-[#E2E8F0] rounded-xl p-2 text-center bg-white text-[#1A202C]"
            />
          </div>
          <div className="flex items-center space-x-2">
            <FiFileText className="w-6 h-6 text-[#FF9900]" />
            <span className="font-medium text-[#1A202C]">No. of Submissions :</span>
            <input
              type="text"
              value={totalSubmissions}
              readOnly
              className="w-16 border border-[#E2E8F0] rounded-xl p-2 text-center bg-white text-[#1A202C]"
            />
          </div>
        </div>

        {/* Search Bar and Filter */}
        <div className="flex justify-center items-center space-x-4 mb-6">
          <div className="relative w-full md:w-1/2">
            <input
              type="text"
              placeholder="Search With SPOC ID or Team Name"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-[#E2E8F0] rounded-full py-3 pl-6 pr-12 focus:ring-2 focus:ring-[#FF9900]/20 text-lg bg-white text-[#1A202C] placeholder-[#A0AEC0]"
            />
            <button className="absolute right-4 top-3 text-[#A0AEC0] hover:text-[#718096]">
              <FiSearch className="w-6 h-6" />
            </button>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="bg-[#FF9900] hover:bg-[#e68900] text-white px-4 py-2 rounded-xl flex items-center space-x-2 font-medium shadow-sm hover:shadow-md transition-all duration-200"
            >
              <FiFilter className="w-5 h-5" />
              <span>Filter</span>
            </button>
            {showFilterDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-[#E2E8F0] rounded-xl shadow-sm z-10">
                <div className="p-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={filterOptions.evaluated}
                      onChange={(e) => setFilterOptions({ ...filterOptions, evaluated: e.target.checked })}
                      className="w-4 h-4 text-[#FF9900] border-[#E2E8F0] rounded focus:ring-[#FF9900]/20"
                    />
                    <span className="text-[#1A202C]">Evaluated</span>
                  </label>
                  <label className="flex items-center space-x-2 mt-3">
                    <input
                      type="checkbox"
                      checked={filterOptions.submitted}
                      onChange={(e) => setFilterOptions({ ...filterOptions, submitted: e.target.checked })}
                      className="w-4 h-4 text-[#FF9900] border-[#E2E8F0] rounded focus:ring-[#FF9900]/20"
                    />
                    <span className="text-[#1A202C]">Submitted</span>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Submission List Table */}
        <div className="overflow-x-auto bg-white rounded-2xl border border-[#E2E8F0]">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#F7F8FC] text-[#4A5568]">
              <tr>
                <th className="p-4 font-semibold">SPOC ID</th>
                <th className="p-4 font-semibold">Submission</th>
                <th className="p-4 font-semibold">Approval Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubmissions.map((sub) => (
                <tr
                  key={sub.id}
                  className="hover:bg-[#F9FAFB] border-t border-[#E2E8F0] transition-all"
                >
                  <td className="p-4 text-[#1A202C] font-medium">{sub.spocId}</td>
                  <td className="p-4">
                    <span
                      className="text-[#2B6CB0] hover:underline cursor-pointer"
                      onClick={() => navigate(`/admin/submissions/${sub.id}/details`)}
                    >
                      {sub.title}
                    </span>
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        sub.status === 'Evaluated'
                          ? 'bg-green-100 text-green-800'
                          : sub.status === 'Submitted'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {sub.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProblemStatementDetail;
