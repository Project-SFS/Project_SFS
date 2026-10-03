import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { FiSearch, FiClock, FiEdit3, FiCheckCircle, FiXCircle, FiInbox, FiRotateCcw, FiChevronRight } from 'react-icons/fi';
import Pagination, { usePagination } from '../../components/common/Pagination';
import { StatusBadge, EVAL_TOTAL_MAX } from '../../submissionStatus';
import { URL } from '../../Utils';
import { useAdmin } from '../../components/admin/adminAccess';
import TeamDetailsModal from '../../components/admin/TeamDetailsModal';

// Every submission across all problem statements, for admins who evaluate. Waiting ones come first
// by default so the evaluator sees what needs attention.
const STATUS_CARDS = [
  { key: 'PENDING', label: 'Awaiting review', icon: FiClock, cls: 'text-yellow-700 bg-yellow-50' },
  { key: 'CHANGES_REQUESTED', label: 'Changes needed', icon: FiEdit3, cls: 'text-orange-700 bg-orange-50' },
  { key: 'APPROVED', label: 'Approved', icon: FiCheckCircle, cls: 'text-green-700 bg-green-50' },
  { key: 'REJECTED', label: 'Rejected', icon: FiXCircle, cls: 'text-red-700 bg-red-50' },
];
const SORTS = [
  ['attention', 'Awaiting review first'],
  ['newest', 'Newest first'],
  ['oldest', 'Oldest first'],
  ['marks', 'Highest marks first'],
];
const EMPTY = { search: '', status: 'all', problem: 'all', college: 'all', sort: 'attention' };
const field = 'px-3 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#1A202C] focus:outline-none focus:ring-2 focus:ring-[#FF9900]/30 focus:border-[#FF9900]';
const readable = (day) => (day ? new Date(`${String(day).slice(0, 10)}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');

const Submissions = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [f, setF] = useState(EMPTY);
  const navigate = useNavigate();
  const { can } = useAdmin();
  const [teamOpen, setTeamOpen] = useState(null); // team id whose details dialog is open
  const set = (key) => (value) => setF((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    axios.get(`${URL}/admin/submissions/all`, { withCredentials: true })
      .then((res) => setRows(res.data.submissions || []))
      .catch((err) => setError(err.response?.data?.message || 'The submissions could not be loaded. Please refresh the page.'))
      .finally(() => setLoading(false));
  }, []);

  const counts = useMemo(() => Object.fromEntries(STATUS_CARDS.map((c) => [c.key, rows.filter((r) => r.STATUS === c.key).length])), [rows]);
  const problems = useMemo(() => {
    const map = new Map();
    rows.forEach((r) => map.set(String(r.PROBLEM_ID), r.PROBLEM_TITLE || `SFS_${r.PROBLEM_ID}`));
    return [...map.entries()].sort((a, b) => Number(b[0]) - Number(a[0]));
  }, [rows]);
  const colleges = useMemo(() => [...new Set(rows.map((r) => r.COLLEGE).filter(Boolean))].sort(), [rows]);

  const visible = useMemo(() => {
    const q = f.search.trim().toLowerCase();
    return rows
      .filter((r) => f.status === 'all' || r.STATUS === f.status)
      .filter((r) => f.problem === 'all' || String(r.PROBLEM_ID) === f.problem)
      .filter((r) => f.college === 'all' || r.COLLEGE === f.college)
      .filter((r) => !q || [r.SOL_TITLE, r.TEAM_NAME, r.TEAM_EMAIL, r.PROBLEM_TITLE, r.COLLEGE, r.REVIEWER_EMAIL, `SFS_${r.PROBLEM_ID}`, `#${r.ID}`]
        .some((v) => String(v || '').toLowerCase().includes(q)))
      .sort((a, b) => {
        if (f.sort === 'oldest') return a.ID - b.ID;
        if (f.sort === 'marks') return (b.EVAL_TOTAL ?? -1) - (a.EVAL_TOTAL ?? -1) || b.ID - a.ID;
        if (f.sort === 'attention') {
          // waiting first (oldest waiting at the top, it has waited longest), then everything else newest first
          const wa = a.STATUS === 'PENDING', wb = b.STATUS === 'PENDING';
          if (wa !== wb) return wa ? -1 : 1;
          return wa ? a.ID - b.ID : b.ID - a.ID;
        }
        return b.ID - a.ID;
      });
  }, [rows, f]);

  const { page, setPage, pageItems, total, totalPages } = usePagination(visible, { resetKey: JSON.stringify(f) });
  const filtersActive = JSON.stringify(f) !== JSON.stringify(EMPTY);

  return (
    <div className="min-h-screen bg-[#F7F8FC] px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[#1A202C] mb-1">Submissions</h1>
        <p className="text-[#718096] text-sm">Every team's solution across all problem statements. Open one to review it.</p>
      </div>

      {/* Status cards: click to filter */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {STATUS_CARDS.map(({ key, label, icon: Icon, cls }) => {
          const active = f.status === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => set('status')(active ? 'all' : key)}
              className={`text-left bg-white rounded-2xl border p-4 flex items-center gap-3 shadow-sm transition hover:border-[#FF9900]/60 ${active ? 'border-[#FF9900] ring-2 ring-[#FF9900]/20' : 'border-[#E2E8F0]'}`}
            >
              <div className={`p-3 rounded-xl ${cls}`}><Icon className="text-lg" /></div>
              <div>
                <div className="text-xs text-[#718096]">{label}</div>
                <div className="text-2xl font-bold text-[#1A202C]">{loading ? '–' : counts[key]}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-4 mb-6 space-y-3">
        <div className="relative">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A0AEC0]" />
          <input
            value={f.search}
            onChange={(e) => set('search')(e.target.value)}
            placeholder="Search by solution, team, lead email, problem, college, reviewer or #ID..."
            className={`${field} w-full pl-11`}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select aria-label="Status" value={f.status} onChange={(e) => set('status')(e.target.value)} className={field}>
            <option value="all">All statuses</option>
            {STATUS_CARDS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
          <select aria-label="Problem statement" value={f.problem} onChange={(e) => set('problem')(e.target.value)} className={`${field} max-w-xs`}>
            <option value="all">All problem statements</option>
            {problems.map(([id, title]) => <option key={id} value={id}>SFS_{id} · {title}</option>)}
          </select>
          <select aria-label="College" value={f.college} onChange={(e) => set('college')(e.target.value)} className={field}>
            <option value="all">All colleges</option>
            {colleges.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select aria-label="Sort" value={f.sort} onChange={(e) => set('sort')(e.target.value)} className={field}>
            {SORTS.map(([k, t]) => <option key={k} value={k}>{t}</option>)}
          </select>
          <span className="text-sm text-[#718096] ml-auto">
            {loading ? '' : filtersActive ? `${visible.length} of ${rows.length} match` : `${rows.length} submissions`}
          </span>
          {filtersActive && (
            <button onClick={() => setF(EMPTY)} className="flex items-center gap-1.5 text-sm font-medium text-[#FF9900] hover:underline">
              <FiRotateCcw /> Clear
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        {loading ? (
          <div className="divide-y divide-[#E2E8F0]">
            {[0, 1, 2, 3, 4].map((i) => <div key={i} className="h-16 animate-pulse bg-gray-50" />)}
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600">{error}</div>
        ) : visible.length === 0 ? (
          <div className="p-10 text-center text-[#718096]">
            <FiInbox className="mx-auto text-3xl mb-2 text-[#A0AEC0]" />
            {rows.length ? 'No submissions match your search or filters.' : 'No team has submitted a solution yet.'}
          </div>
        ) : (
          <>
            {/* table on large screens */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-[#F7F8FC] text-left text-[#4A5568]">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Solution</th>
                    <th className="px-5 py-3 font-semibold">Problem</th>
                    <th className="px-5 py-3 font-semibold">Team · College</th>
                    <th className="px-5 py-3 font-semibold">Submitted</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold">Marks</th>
                    <th className="px-5 py-3 font-semibold">Reviewed by</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {pageItems.map((r) => (
                    <tr key={r.ID} onClick={() => navigate(`/admin/submissions/${r.ID}/details`)} className="cursor-pointer hover:bg-[#FFF7EC]">
                      <td className="px-5 py-3 max-w-[16rem]">
                        <div className="font-medium text-[#1A202C] truncate" title={r.SOL_TITLE}>{r.SOL_TITLE || 'Untitled'}</div>
                        <div className="text-xs text-[#A0AEC0]">#{r.ID}{r.REVIEW_COUNT > 1 ? ` · ${r.REVIEW_COUNT} reviews` : ''}</div>
                      </td>
                      <td className="px-5 py-3 max-w-[14rem]">
                        <Link to={`/admin/problems/${r.PROBLEM_ID}/details`} onClick={(e) => e.stopPropagation()} className="text-[#2B6CB0] hover:underline block truncate" title={r.PROBLEM_TITLE}>
                          {r.PROBLEM_TITLE || '—'}
                        </Link>
                        <div className="text-xs text-[#A0AEC0]">SFS_{r.PROBLEM_ID}</div>
                      </td>
                      <td className="px-5 py-3 max-w-[14rem]">
                        {r.TEAM_ID && can('USERS') ? (
                          <button type="button" onClick={(e) => { e.stopPropagation(); setTeamOpen(r.TEAM_ID); }} className="block max-w-full text-left text-[#2B6CB0] hover:underline truncate" title="View team details">
                            {r.TEAM_NAME || r.TEAM_EMAIL}
                          </button>
                        ) : (
                          <div className="text-[#1A202C] truncate">{r.TEAM_NAME || r.TEAM_EMAIL}</div>
                        )}
                        <div className="text-xs text-[#718096] truncate">{r.COLLEGE || '—'}</div>
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap text-[#4A5568]">{readable(r.SUB_DATE)}</td>
                      <td className="px-5 py-3"><StatusBadge status={r.STATUS} /></td>
                      <td className="px-5 py-3 whitespace-nowrap">{r.STATUS === 'APPROVED' && r.EVAL_TOTAL != null ? <b>{r.EVAL_TOTAL} / {EVAL_TOTAL_MAX}</b> : <span className="text-[#A0AEC0]">—</span>}</td>
                      <td className="px-5 py-3 text-[#4A5568] max-w-[12rem]">
                        {/* a revised upload is waiting again: the reviewer shown is from the earlier round */}
                        {r.STATUS === 'PENDING' && r.REVIEW_COUNT > 0
                          ? <><div className="text-xs font-semibold text-orange-700">Resubmitted</div><div className="text-xs text-[#A0AEC0] truncate" title={r.REVIEWER_EMAIL}>last: {r.REVIEWER_EMAIL || '—'}</div></>
                          : <div className="truncate" title={r.REVIEWER_EMAIL || ''}>{r.REVIEWER_EMAIL || <span className="text-[#A0AEC0]">Not yet</span>}</div>}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className="inline-flex items-center gap-1 text-[#FF9900] font-medium whitespace-nowrap">
                          {r.STATUS === 'PENDING' || r.STATUS === 'CHANGES_REQUESTED' ? 'Review' : 'View'} <FiChevronRight />
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* cards on small screens */}
            <ul className="lg:hidden divide-y divide-[#E2E8F0]">
              {pageItems.map((r) => (
                <li key={r.ID}>
                  <Link to={`/admin/submissions/${r.ID}/details`} className="block px-4 py-4 hover:bg-[#FFF7EC]">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium text-[#1A202C] truncate">{r.SOL_TITLE || 'Untitled'}</div>
                        <div className="text-xs text-[#718096] truncate">SFS_{r.PROBLEM_ID} · {r.PROBLEM_TITLE}</div>
                        <div className="text-xs text-[#718096] truncate">{r.TEAM_NAME || r.TEAM_EMAIL} · {r.COLLEGE || '—'}</div>
                      </div>
                      <StatusBadge status={r.STATUS} />
                    </div>
                    <div className="mt-2 text-xs text-[#A0AEC0]">
                      Submitted {readable(r.SUB_DATE)}{r.STATUS === 'APPROVED' && r.EVAL_TOTAL != null ? ` · ${r.EVAL_TOTAL}/${EVAL_TOTAL_MAX}` : ''}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
      <Pagination page={page} totalPages={totalPages} total={total} onChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }} label="submissions" />
      {teamOpen && <TeamDetailsModal teamId={teamOpen} onClose={() => setTeamOpen(null)} />}
    </div>
  );
};

export default Submissions;
