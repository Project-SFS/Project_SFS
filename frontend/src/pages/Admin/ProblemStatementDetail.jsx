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
  FiTrash2,
  FiEdit2,
  FiLink,
  FiLock,
  FiUnlock,
  FiChevronUp,
  FiChevronDown
} from 'react-icons/fi';
import { copyText } from '../../submissionFiles';
import TeamDetailsModal from '../../components/admin/TeamDetailsModal';
import { URL } from '../../Utils';
import { StatusBadge, normalizeStatus } from '../../submissionStatus';
import Pagination, { usePagination } from '../../components/common/Pagination';
import { useAdmin } from '../../components/admin/adminAccess';

const ProblemStatementDetail = () => {
  const { can } = useAdmin();
  const { id } = useParams();
  const navigate = useNavigate();

  const [linkCopied, setLinkCopied] = useState(false);
  const [teamOpen, setTeamOpen] = useState(null); // team id whose details dialog is open
  const [closing, setClosing] = useState(false);

  // close ("Concept Received": no new solutions) or reopen the challenge
  const toggleClosed = async () => {
    const closeIt = !problem?.closed;
    if (closeIt && !window.confirm('Close this challenge? It will show as "Concept Received" and teams can no longer submit new solutions. You can reopen it later.')) return;
    setClosing(true);
    try {
      const res = await axios.post(`${URL}/problems/${id}/close`, { closed: closeIt }, { withCredentials: true });
      setProblem((prev) => ({ ...prev, closed: closeIt, closedAt: closeIt ? new Date().toISOString() : null, closedByEmail: closeIt ? null : null }));
      toast.success(res.data?.message || (closeIt ? 'Challenge closed' : 'Challenge reopened'));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not change the challenge status');
    } finally {
      setClosing(false);
    }
  };
  const [problem, setProblem] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [collegeFilter, setCollegeFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');
  // the information card can be folded away to get to the submissions faster (remembered per browser)
  const [infoOpen, setInfoOpen] = useState(() => { try { return localStorage.getItem('sfs_problem_info_open') !== '0'; } catch { return true; } });
  const toggleInfo = () => setInfoOpen((open) => { try { localStorage.setItem('sfs_problem_info_open', open ? '0' : '1'); } catch { /* private mode */ } return !open; });
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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
            teamCount: p.team_count ?? null,
            closed: Boolean(p.IS_CLOSED),
            closedAt: p.CLOSED_AT || null,
            closedByEmail: p.closed_by_email || null,
            domain: p.DOMAIN || '',
            technology: p.TECHNOLOGY || '',
            outcomes: p.EXPECTED_OUTCOMES || '',
            requirements: p.REQUIREMENTS || '',
            createdAt: p.CREATED_AT || null,
            createdByName: p.created_by_name || null,
            createdByEmail: p.created_by_email || null,
            createdById: p.CREATED_BY ?? null
          });
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to load challenge');
      }
    };

    const fetchSubmissions = async () => {
      try {
        const res = await axios.post(
          `${URL}/submissions_by_id`,
          { id },
          { withCredentials: true }
        );

        

        if (!Array.isArray(res.data)) return;
        
        const normalized = res.data.map(s => ({
          
          id: String(s.submission_id ?? ''),
          // a team deleted before teams were archived has no name any more: show its lead email
          team_id: s.team_id || null,
          team_name: s.team_name || s.TEAM_EMAIL || 'N/A',
          team_note: !s.team_name ? 'team deleted' : s.REMOVED_AT ? 'removed by SPOC' : s.GRADUATED_AT ? 'graduated' : '',
          college: s.college_name || '',
          title: s.SOL_TITLE || 'No Title',
          status: normalizeStatus(s.STATUS),
          comment: s.EVALUATION_COMMENT || '',
          total: s.EVAL_TOTAL ?? null,
          evaluatedByName: s.evaluated_by_name || null,
          evaluatedByEmail: s.evaluated_by_email || null,
          evaluatedAt: s.EVALUATED_AT || null
        }));

        
        if (mounted) setSubmissions(normalized);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load submissions');
      }
    };

    // an address like /admin/problems/abc/details is simply "not found", without error messages
    if (!/^\d+$/.test(String(id))) {
      setLoading(false);
      return () => { mounted = false; };
    }

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
      toast.success('Challenge deleted');
      navigate('/admin/problems');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete challenge');
    } finally {
      setShowDeleteModal(false);
    }
  };

  const formatDateTime = (value) =>
    value ? new Date(value).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : null;

  /* ---------------- Filters ---------------- */

  const filteredSubmissions = submissions.filter(sub => {
    const search = searchTerm.toLowerCase();

    const matchesSearch =
      (sub.team_name || '').toLowerCase().includes(search) ||
      (sub.college || '').toLowerCase().includes(search) ||
      (sub.title || '').toLowerCase().includes(search);

    const matchesFilter = statusFilter === 'all' || sub.status === statusFilter;
    const matchesCollege = collegeFilter === 'all' || sub.college === collegeFilter;

    return matchesSearch && matchesFilter && matchesCollege;
  }).sort((a, b) => {
    if (sortOrder === 'oldest') return Number(a.id) - Number(b.id);
    if (sortOrder === 'marks') return (b.total ?? -1) - (a.total ?? -1) || Number(b.id) - Number(a.id);
    if (sortOrder === 'team') return String(a.team_name).localeCompare(String(b.team_name));
    return Number(b.id) - Number(a.id);
  });
  const colleges = [...new Set(submissions.map((s) => s.college).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  const filtersActive = searchTerm || statusFilter !== 'all' || collegeFilter !== 'all' || sortOrder !== 'newest';

  // hooks stay above the loading / not-found returns below
  const { page, setPage, pageItems, total, totalPages } = usePagination(filteredSubmissions, {
    resetKey: `${searchTerm}|${statusFilter}|${collegeFilter}|${sortOrder}`
  });

  // teams that submitted a solution to this challenge
  const teamsEnrolled = problem?.teamCount ?? new Set(
    submissions.map(s => s.team_name).filter(name => name && name !== 'N/A')
  ).size;

  const totalSubmissions = submissions.length;

  /* ---------------- Loading / Error ---------------- */

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F8FC] flex flex-col items-center justify-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF9900]"></div>
        <h2 className="text-xl font-semibold text-gray-700">
          Challenge Loading...
        </h2>
      </div>
    );
  }




  if (!problem) {
    return (
      <div className="min-h-screen bg-gray-50 py-10">
        <div className="max-w-4xl mx-auto bg-white shadow rounded-lg p-8">
          <h1 className="text-lg text-[#1A202C]">Challenge not found</h1>
          <p className="text-sm text-[#718096] mt-1">It may have been deleted, or the link is wrong.</p>
          <Button
            onClick={() => navigate('/admin/problems')}
            className="mt-4 !bg-[#FF9900] text-white px-4 py-2 rounded-xl"
          >
            Back to challenges
          </Button>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-[#F7F8FC] px-6 py-8 transition-all duration-300">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
          <Breadcrumb />
          <div className="flex flex-wrap gap-3">
            {/* public link to this problem (opens its details on the Explore Challenges page, on this site's domain) */}
            <Button
              onClick={async () => {
                const link = `${window.location.origin}/problemstatements?problem=${id}`;
                if (await copyText(link)) { setLinkCopied(true); setTimeout(() => setLinkCopied(false), 3000); }
              }}
              title={`${window.location.origin}/problemstatements?problem=${id}`}
              className="!bg-white border border-[#E2E8F0] !text-[#4A5568] hover:!bg-[#F7F8FC] px-4 py-2 rounded-xl flex items-center space-x-2 font-medium shadow-sm transition-all duration-200"
            >
              <FiLink className="w-5 h-5" />
              <span>{linkCopied ? 'Link copied' : 'Copy public link'}</span>
            </Button>
            {can('PROBLEMS') && (<>
            <Button
              onClick={toggleClosed}
              disabled={closing}
              className={`px-4 py-2 rounded-xl flex items-center space-x-2 font-medium shadow-sm transition-all duration-200 disabled:opacity-60 ${problem.closed ? '!bg-green-600 hover:!bg-green-700 !text-white' : '!bg-gray-800 hover:!bg-black !text-white'}`}
              title={problem.closed ? 'Take new solutions again' : 'Stop new solutions; the challenge shows as Concept Received'}
            >
              {problem.closed ? <FiUnlock className="w-5 h-5" /> : <FiLock className="w-5 h-5" />}
              <span>{closing ? 'Saving…' : problem.closed ? 'Reopen challenge' : 'Close challenge'}</span>
            </Button>
            <Button
              onClick={() => navigate(`/admin/problems/edit/${id}`)}
              className="!bg-white border border-[#FF9900] !text-[#FF9900] hover:!bg-[#FF9900] hover:!text-white px-4 py-2 rounded-xl flex items-center space-x-2 font-medium shadow-sm transition-all duration-200"
            >
              <FiEdit2 className="w-5 h-5" />
              <span>Edit</span>
            </Button>
            <Button
              onClick={() => setShowDeleteModal(true)}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl flex items-center space-x-2 font-medium shadow-sm hover:shadow-md transition-all duration-200"
            >
              <FiTrash2 className="w-5 h-5" />
              <span>Delete</span>
            </Button>
            </>)}
            <Button
              onClick={() => navigate(-1)}
              className="!bg-[#FF9900] !hover:bg-[#e68900] text-white px-4 py-2 rounded-xl flex items-center space-x-2 font-medium shadow-sm hover:shadow-md transition-all duration-200"
            >
              <FiArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </Button>
          </div>
        </div>
        
        {/* Challenge Information Table */}
        <div className="bg-white shadow-sm rounded-2xl p-6 border border-[#E2E8F0] mb-8">
          <button
            type="button"
            onClick={toggleInfo}
            aria-expanded={infoOpen}
            className={`w-full flex items-center justify-between gap-3 text-left ${infoOpen ? 'mb-4' : ''}`}
          >
            <span className="min-w-0">
              <span className="block text-xl font-semibold text-[#1A202C]">Challenge Information</span>
              {!infoOpen && <span className="block text-sm text-[#718096] truncate">SFS_{problem.id} · {problem.title}</span>}
            </span>
            <span className="shrink-0 p-2 rounded-full border border-[#E2E8F0] text-[#4A5568] hover:bg-[#F7F8FC]" title={infoOpen ? 'Minimise' : 'Expand'}>
              {infoOpen ? <FiChevronUp className="w-5 h-5" /> : <FiChevronDown className="w-5 h-5" />}
            </span>
          </button>
          {infoOpen && (
          <table className="w-full text-left border-collapse border border-[#E2E8F0] rounded-xl overflow-hidden">
            <tbody>
              <tr className="border-b border-[#E2E8F0]">
                <td className="p-4 font-medium bg-[#FF9900]/5 w-1/3 text-[#1A202C]">Challenge ID</td>
                <td className="p-4 text-[#1A202C]">{problem.id}</td>
              </tr>
              <tr className="border-b border-[#E2E8F0]">
                <td className="p-4 font-medium bg-[#FF9900]/5 text-[#1A202C]">Challenge Title</td>
                <td className="p-4 text-[#1A202C]">{problem.title}</td>
              </tr>
              <tr className="border-b border-[#E2E8F0]">
                <td className="p-4 font-medium bg-[#FF9900]/5 text-[#1A202C]">Category</td>
                <td className="p-4 text-[#1A202C]">{problem.category}</td>
              </tr>
              <tr className="border-b border-[#E2E8F0]">
                <td className="p-4 font-medium bg-[#FF9900]/5 text-[#1A202C]">Description</td>
                <td className="p-4 text-[#1A202C] whitespace-pre-line">{problem.description}</td>
              </tr>
              <tr className="border-b border-[#E2E8F0]">
                <td className="p-4 font-medium bg-[#FF9900]/5 text-[#1A202C]">Domain</td>
                <td className="p-4 text-[#1A202C]">{problem.domain || 'N/A'}</td>
              </tr>
              <tr className="border-b border-[#E2E8F0]">
                <td className="p-4 font-medium bg-[#FF9900]/5 text-[#1A202C]">Expected Outcomes</td>
                <td className="p-4 text-[#1A202C]"><span className="whitespace-pre-line">{problem.outcomes || 'N/A'}</span></td>
              </tr>
              <tr className="border-b border-[#E2E8F0]">
                <td className="p-4 font-medium bg-[#FF9900]/5 text-[#1A202C]">Requirements</td>
                <td className="p-4 text-[#1A202C]"><span className="whitespace-pre-line">{problem.requirements || 'N/A'}</span></td>
              </tr>
              <tr className="border-b border-[#E2E8F0]">
                <td className="p-4 font-medium bg-[#FF9900]/5 text-[#1A202C]">Technology</td>
                <td className="p-4 text-[#1A202C]">{problem.technology || 'N/A'}</td>
              </tr>
              <tr className="border-b border-[#E2E8F0]">
                <td className="p-4 font-medium bg-[#FF9900]/5 text-[#1A202C]">Status</td>
                <td className="p-4 text-[#1A202C]">
                  {problem.closed ? (
                    <span>
                      <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-200 text-gray-700">Concept Received</span>
                      <span className="ml-2 text-sm text-[#718096]">closed{problem.closedAt ? ` on ${new Date(problem.closedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}` : ''}{problem.closedByEmail ? ` by ${problem.closedByEmail}` : ''} · no new solutions</span>
                    </span>
                  ) : (
                    <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">Open for solutions</span>
                  )}
                </td>
              </tr>
              <tr className="border-b border-[#E2E8F0]">
                <td className="p-4 font-medium bg-[#FF9900]/5 text-[#1A202C]">Created By</td>
                <td className="p-4 text-[#1A202C]">
                  {problem.createdByName || problem.createdByEmail ? (
                    <>
                      <span className="font-medium break-all">{problem.createdByEmail || problem.createdByName}</span>
                    </>
                  ) : (
                    <span className="text-[#A0AEC0]">{problem.createdById ? 'Deleted user' : 'Not recorded'}</span>
                  )}
                </td>
              </tr>
              <tr className="border-b border-[#E2E8F0]">
                <td className="p-4 font-medium bg-[#FF9900]/5 text-[#1A202C]">Created On</td>
                <td className="p-4 text-[#1A202C]">
                  {formatDateTime(problem.createdAt) || <span className="text-[#A0AEC0]">Not recorded</span>}
                </td>
              </tr>
            </tbody>
          </table>
          )}
        </div>
        

        {/* Statistics Section */}
        <div className="flex items-center space-x-10 mb-6 px-2">
          <div className="flex items-center space-x-2">
            <FiUsers className="w-6 h-6 text-[#FF9900]" />
            <span className="font-medium text-[#1A202C]">No. of Teams :</span>
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
        <div className="flex flex-wrap justify-center items-center gap-3 mb-6">
          <div className="relative w-full md:w-96">
            <input
              type="text"
              placeholder="Search team, college or solution title"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-[#E2E8F0] rounded-full py-3 pl-6 pr-12 focus:ring-2 focus:ring-[#FF9900]/20 text-lg bg-white text-[#1A202C] placeholder-[#A0AEC0]"
            />
            <button className="absolute right-4 top-3 text-[#A0AEC0] hover:text-[#718096]">
              <FiSearch className="w-6 h-6" />
            </button>
          </div>
          <label className="flex items-center gap-2 text-sm font-medium text-[#4A5568]">
            <FiFilter className="w-5 h-5 text-[#FF9900]" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-[#E2E8F0] rounded-xl px-3 py-2.5 bg-white text-[#1A202C] focus:ring-2 focus:ring-[#FF9900]/20 outline-none"
            >
              <option value="all">All statuses</option>
              <option value="PENDING">Awaiting review</option>
              <option value="CHANGES_REQUESTED">Changes needed</option>
              <option value="APPROVED">Concept accepted</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </label>
          <select
            aria-label="College"
            value={collegeFilter}
            onChange={(e) => setCollegeFilter(e.target.value)}
            className="border border-[#E2E8F0] rounded-xl px-3 py-2.5 bg-white text-sm text-[#1A202C] focus:ring-2 focus:ring-[#FF9900]/20 outline-none max-w-[14rem]"
          >
            <option value="all">All colleges</option>
            {colleges.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            aria-label="Sort"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="border border-[#E2E8F0] rounded-xl px-3 py-2.5 bg-white text-sm text-[#1A202C] focus:ring-2 focus:ring-[#FF9900]/20 outline-none"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="marks">Highest marks first</option>
            <option value="team">Team name A–Z</option>
          </select>
          {filtersActive && (
            <button
              type="button"
              onClick={() => { setSearchTerm(''); setStatusFilter('all'); setCollegeFilter('all'); setSortOrder('newest'); }}
              className="text-sm font-medium text-[#FF9900] hover:underline"
            >
              Clear
            </button>
          )}
          <span className="w-full text-center text-sm text-[#718096]">
            {filteredSubmissions.length === submissions.length ? `${submissions.length} submissions` : `${filteredSubmissions.length} of ${submissions.length} submissions match`}
          </span>
        </div>

        {/* Submission List Table */}
        <div className="overflow-x-auto bg-white rounded-2xl border border-[#E2E8F0] shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#F7F8FC] text-[#4A5568]">
              <tr>
                <th className="p-4 font-semibold">Team Name</th>
                <th className="p-4 font-semibold">College</th>
                <th className="p-4 font-semibold">Title</th>
                <th className='p-4 font-semibold'>Review</th>
                <th className="p-4 font-semibold">Status</th>
                <th className='p-4 font-semibold'>Marks</th>
                <th className='p-4 font-semibold'>Latest Comment</th>
                <th className='p-4 font-semibold'>Reviewed By</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((sub) => (
                <tr
                  key={sub.id}
                  className="hover:bg-[#F9FAFB] border-t border-[#E2E8F0] transition-all"
                >
                  <td className="p-4 text-[#1A202C] font-medium">
                    {sub.team_id && can('USERS') ? (
                      <button type="button" onClick={() => setTeamOpen(sub.team_id)} className="break-all text-left text-[#2B6CB0] hover:underline" title="View team details">
                        {sub.team_name}
                      </button>
                    ) : (
                      <div className="break-all">{sub.team_name}</div>
                    )}
                    {sub.team_note && <div className="text-xs font-normal text-[#A0AEC0]">{sub.team_note}</div>}
                  </td>
                  <td className="p-4 text-[#4A5568]">{sub.college || <span className="text-[#A0AEC0]">—</span>}</td>
                  <td className="p-4">
                    <span
                      className="text-[#2B6CB0] font-bold"
                    >
                      {sub.title}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => navigate(`/admin/submissions/${sub.id}/details`)}
                      className="bg-[#FF9900] text-white font-bold px-4 py-2 rounded-xl shadow hover:bg-[#e68900]"
                    >
                      {!can('EVALUATE') || sub.status === 'APPROVED' || sub.status === 'REJECTED' ? 'View' : 'Review'}
                    </button>

                  </td>
                  <td className="p-4">
                    <StatusBadge status={sub.status} />
                  </td>
                  <td className="p-4 text-[#1A202C] whitespace-nowrap">
                    {sub.total != null ? <span className="font-semibold">{sub.total} / 100</span> : <span className="text-[#A0AEC0]">-</span>}
                  </td>
                  <td className="p-4 text-[#1A202C]">
                      {sub.comment ? (
                        <span className="block max-w-xs text-sm line-clamp-2" title={sub.comment}>{sub.comment}</span>
                      ) : (
                        <span className="text-[#A0AEC0]">-</span>
                      )}
                  </td>
                  <td className="p-4 text-[#1A202C]">
                    {sub.evaluatedByName || sub.evaluatedByEmail ? (
                      <>
                        <span className="font-medium break-all">{sub.evaluatedByEmail || sub.evaluatedByName}</span>
                        {sub.evaluatedAt && (
                          <span className="block text-xs text-[#718096]">{formatDateTime(sub.evaluatedAt)}</span>
                        )}
                      </>
                    ) : sub.status === 'PENDING' ? (
                      <span className="text-[#A0AEC0]">-</span>
                    ) : (
                      <span className="text-[#A0AEC0]">{sub.evaluatedAt ? 'Deleted user' : 'Not recorded'}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredSubmissions.length === 0 && (
            <p className="p-6 text-center text-[#A0AEC0] italic">
              {submissions.length ? 'No submissions match the search or filter.' : 'No submissions yet for this challenge.'}
            </p>
          )}
        </div>
        <Pagination page={page} totalPages={totalPages} total={total} onChange={setPage} label="submissions" />
      </div>

      {/* Delete Confirmation Modal */}
      {
        showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform transition-all">
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Challenge</h3>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete this challenge? All of its submissions and uploaded files will be deleted too. This action cannot be undone.
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
      {teamOpen && <TeamDetailsModal teamId={teamOpen} onClose={() => setTeamOpen(null)} />}
    </div>
  );
};

export default ProblemStatementDetail;