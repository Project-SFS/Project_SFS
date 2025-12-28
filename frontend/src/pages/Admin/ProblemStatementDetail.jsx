import  { useState, useEffect, useLayoutEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import Button from '../../components/common/button';
import Breadcrumb from '../../components/common/Breadcrumb';
import {
  FiSearch,
  FiFilter,
  FiUsers,
  FiFileText,
  FiArrowLeft,
  FiTrash2
} from 'react-icons/fi';
import { URL } from '../../Utils';

const ProblemStatementDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [problem, setProblem] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOptions, setFilterOptions] = useState({
    evaluated: false,
    submitted: false
  });
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [showSolutionModal, setShowSolutionModal] = useState(false);
const [solutionLoading, setSolutionLoading] = useState(false);
const [solutionData, setSolutionData] = useState(null);
  const [activeSubmissionId, setActiveSubmissionId] = useState(null);
  const [original, setOriginal] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(null);

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);


  useEffect(() => {
    let mounted = true;

    const fetchProblem = async () => {
      try {
        const res = await axios.get(`${URL}/problems/${id}`, {
          withCredentials: true
        });

        const p =
          res.data?.problems?.[0] ||
          res.data?.problem ||
          null;
       
        if (p && mounted) {
          setProblem({
            id: String(p.ID ?? p.id ?? ''),
            title: p.TITLE || p.title || 'Untitled',
            description: p.DESCRIPTION || p.description || '',
            category: p.CATEGORY || p.category || 'N/A',
            youtube: p.Reference || p.youtube || p.youtube_link || '',
            dataset: p.Reference || p.dataset || '',
            created: p.SUB_DATE
              ? new Date(p.SUB_DATE).toISOString()
              : new Date().toISOString()
          });
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to load problem statement');
      }
    };

    const fetchSubmissions = async () => {
      try {
        const res = await axios.post(
          `${URL}/submissions_by_id`,
          { id },
          { withCredentials: true }
        );

        
        setOriginal(res.data)
        

        if (!Array.isArray(res.data)) return;
      
        
        const normalized = res.data.map(s => ({
          //  ;
          
          id: String(s.submission_id ?? ''),
          team_name: s.team_name || 'N/A',
          title: s.SOL_TITLE || 'No Title',
          status: String(s.STATUS || 'N/A')
            .trim()
            .toUpperCase(),
          marks:s.MARK
        }));

        
        
        if (mounted) setSubmissions(normalized);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load submissions');
      }
    };

    Promise.all([fetchProblem(), fetchSubmissions()])
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, [id]);



  const confirmDelete = async () => {
    try {
      await axios.post(
        `${URL}/delete_problem`,
        { id },
        { withCredentials: true }
      );
      toast.success('Problem statement deleted');
      navigate('/admin/problems');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete problem statement');
    } finally {
      setShowDeleteModal(false);
    }
  };

  /* ---------------- Filters ---------------- */

  const filteredSubmissions = submissions.filter(sub => {
    const search = searchTerm.toLowerCase();

    const matchesSearch =
      (sub.team_name || '').toLowerCase().includes(search) ||
      (sub.title || '').toLowerCase().includes(search);

    const status = sub.status;

    const matchesFilter =
      (!filterOptions.evaluated && !filterOptions.submitted) ||
      (filterOptions.evaluated && status === 'EVALUATED') ||
      (filterOptions.submitted && status === 'SUBMITTED');

    return matchesSearch && matchesFilter;
  });

  const teamsEnrolled = new Set(
    submissions.map(s => s.team_name).filter(Boolean)
  ).size;

  const totalSubmissions = submissions.length;

  const fetchSolution = async (submissionId) => {
  try {
    setSolutionLoading(true);
    setSolutionData(null);

    const res = await axios.get(
      `${URL}/submission_solution/${submissionId}`,
      { withCredentials: true }
    );

    // Adjust keys based on backend response
    setSolutionData(res.data);
  } catch (err) {
    console.error(err);
    toast.error('Failed to load solution');
  } finally {
    setSolutionLoading(false);
  }
  };
  
 
  

  /* ---------------- Loading / Error ---------------- */

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F8FC] flex flex-col items-center justify-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF9900]"></div>
        <h2 className="text-xl font-semibold text-gray-700">
          Problem Statement Loading...
        </h2>
      </div>
    );
  }




  {showSolutionModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6">

      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-[#1A202C]">
          Submission Solution
        </h3>
        <button
          onClick={() => setShowSolutionModal(false)}
          className="text-gray-500 hover:text-gray-700 text-xl"
        >
          ✕
        </button>
        </div>
        
      {/* Content */}
      {solutionLoading ? (
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#FF9900]"></div>
        </div>
      ) : solutionData ? (
        <div className="space-y-4">

          {/* Text Solution */}
          {solutionData.solutionText && (
            <div className="bg-gray-50 border rounded-xl p-4 text-[#1A202C] whitespace-pre-wrap">
              {solutionData.solutionText}
            </div>
          )}

          {/* File / PDF Link */}
          {solutionData.solutionFile && (
            <a
              href={solutionData.solutionFile}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 font-medium hover:underline"
            >
              View Attached Solution File
            </a>
          )}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-6">
          No solution available
        </p>
      )}
    </div>
  </div>
)}


  if (!problem) {
    return (
      <div className="min-h-screen bg-gray-50 py-10">
        <div className="max-w-4xl mx-auto bg-white shadow rounded-lg p-8">
          <h1>Problem Statement not found</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F8FC] px-6 py-8 transition-all duration-300">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Breadcrumb />
          <div className="flex gap-4">
            <Button
              onClick={confirmDelete}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl flex items-center space-x-2 font-medium shadow-sm hover:shadow-md transition-all duration-200"
            >
              <FiTrash2 className="w-5 h-5" />
              <span>Delete</span>
            </Button>
            <Button
              onClick={() => navigate(-1)}
              className="!bg-[#FF9900] !hover:bg-[#e68900] text-white px-4 py-2 rounded-xl flex items-center space-x-2 font-medium shadow-sm hover:shadow-md transition-all duration-200"
            >
              <FiArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </Button>
          </div>
        </div>
        
        {/*  data  */}

        {showSolutionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6">

              {/* Header */}
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-[#1A202C]">
                  Submission Solution
                </h3>
                <button
                  onClick={() => setShowSolutionModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-xl"
                >
                  ✕
                </button>
              </div>

              {/* Content */}
              {solutionLoading ? (
                <div className="flex justify-center items-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#FF9900]"></div>
                </div>
              ) : original ? (
                  <div className="space-y-4">
                    
                  {/* Text Solution */}
                    {original[currentIndex].SOL_DESCRIPTION && (
                    <div className="bg-gray-50 border rounded-xl p-4 text-[#1A202C] whitespace-pre-wrap">
                        {original[currentIndex].SOL_DESCRIPTION}
                    </div>
                    )}
                    
                  {/* File / PDF Link */}
                    {original[currentIndex].FILES && (
                      
                      
                    <a
                      href={URL +"/" + ""+original[currentIndex]?.FILES}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 font-medium hover:underline"
                    >
                      View Attached Solution File
                    </a>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-6">
                  No solution available
                </p>
              )}
            </div>
          </div>
        )}

        {/* Problem Statement Information Table */}
        <div className="bg-white shadow-sm rounded-2xl p-6 border border-[#E2E8F0] mb-8">
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
                <td className="p-4 font-medium bg-[#FF9900]/5 text-[#1A202C]">Category</td>
                <td className="p-4 text-[#1A202C]">{problem.category}</td>
              </tr>
              <tr className="border-b border-[#E2E8F0]">
                <td className="p-4 font-medium bg-[#FF9900]/5 text-[#1A202C]">Description</td>
                <td className="p-4 text-[#1A202C]">{problem.description}</td>
              </tr>
              <tr className="border-b border-[#E2E8F0]">
                <td className="p-4 font-medium bg-[#FF9900]/5 text-[#1A202C]">YouTube Link</td>
                <td className="p-4 text-[#1A202C]">
                  {problem.youtube ? (
                    <a href={problem.youtube} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {problem.youtube}
                    </a>
                  ) : 'N/A'}
                </td>
              </tr>
              <tr>
                <td className="p-4 font-medium bg-[#FF9900]/5 text-[#1A202C]">Dataset Link</td>
                <td className="p-4 text-[#1A202C]">
                  {problem.dataset ? (
                    <a href={problem.dataset} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {problem.dataset}
                    </a>
                  ) : 'N/A'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        

        {/* Statistics Section */}
        <div className="flex items-center space-x-10 mb-6 px-2">
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
        <div className="overflow-x-auto bg-white rounded-2xl border border-[#E2E8F0] shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#F7F8FC] text-[#4A5568]">
              <tr>
                <th className="p-4 font-semibold">Team Name</th>
                <th className="p-4 font-semibold">Title</th>
                <th className='p-4 font-semibold'>View</th>
                <th className="p-4 font-semibold">Status</th>
                <th className='p-4 font-semibold'>Marks</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubmissions.map((sub, key) => (
                <tr
                  key={sub.id}
                  className="hover:bg-[#F9FAFB] border-t border-[#E2E8F0] transition-all"
                >
                  <td className="p-4 text-[#1A202C] font-medium">{sub.team_name}</td>
                  <td className="p-4">
                    <span
                      className="text-[#2B6CB0] font-bold"
                    >
                      {sub.title}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => {
                       
                        setCurrentIndex(key);
                        
    setActiveSubmissionId(sub.id);
    setShowSolutionModal(true);
    fetchSolution(sub.id);
  }}
  className="bg-[#FF9900] text-white font-bold px-4 py-2 rounded-xl shadow hover:bg-[#e68900]"
>
  Solution
</button>

                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${sub.status === 'EVALUATED'
                        ? 'bg-green-100 text-green-800'
                        : sub.status === 'PENDING'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                        }`}
                    >
                      {sub.status}
                    </span>
                  </td>
                  <td className="p-4 text-[#1A202C]">
                      <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 font-medium">
                        {sub.marks}
                      </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {
        showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform transition-all">
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Problem Statement</h3>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete this problem statement? This action cannot be undone.
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-xl font-medium shadow-md hover:shadow-lg transition-all"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }
    </div>

    
  );
};

export default ProblemStatementDetail;