import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link, useSearchParams } from "react-router-dom";
import { FiSearch, FiUsers, FiUpload, FiCheckCircle, FiClipboard, FiX, FiRotateCcw, FiAward, FiMail, FiChevronDown, FiChevronUp, FiKey, FiArchive } from "react-icons/fi";
import { URL } from "../../Utils";
import Pagination, { usePagination } from "../../components/common/Pagination";
import { StatusBadge } from "../../submissionStatus";
import ChangePasswordModal from "../../components/ChangePasswordModal";

// Every registered team for the admin, with filters. Data: GET /admin/teams
const SUBMISSION_FILTERS = [
  ["all", "All teams"],
  ["with", "Has submissions"],
  ["without", "No submissions"],
];
const PROBLEM_FILTERS = [
  ["all", "Any"],
  ["assigned", "Has an assigned problem"],
  ["requested", "Has a pending request"],
  ["none", "No problem yet"],
];
const EVALUATION_FILTERS = [
  ["all", "Any"],
  ["evaluated", "Has a reviewed solution"],
  ["awaiting", "Awaiting review"],
];
const STATUS_FILTERS = [
  ["all", "All teams"],
  ["active", "Active"],
  ["graduated", "Graduated (archived)"],
  ["removed", "Removed by SPOC (archived)"],
];
// Active, graduated (archived after the last member's year) or removed by the SPOC (archived, records kept)
const teamState = (t) => (t.REMOVED_AT ? "removed" : t.GRADUATED_AT ? "graduated" : "active");
const SORTS = [
  ["newest", "Newest first"],
  ["oldest", "Oldest first"],
  ["name", "Team name A–Z"],
  ["submissions", "Most submissions"],
];
const EMPTY_FILTERS = { search: "", status: "all", college: "all", submissions: "all", problem: "all", evaluation: "all", sort: "newest" };

const formatDateTime = (value) =>
  value ? new Date(value).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : null;

// One logged email; the text opens on click
const MailItem = ({ mail }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="px-4 py-3 text-sm">
      <button onClick={() => setOpen(!open)} className="w-full text-left flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-medium text-[#1A202C]">{mail.SUBJECT || "(no subject)"}</div>
          <div className="text-xs text-[#718096] break-all">
            To {mail.TO_ADDR} · {formatDateTime(mail.SENT_AT)}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {mail.STATUS !== "SENT" && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Not delivered</span>}
          {open ? <FiChevronUp className="text-[#718096]" /> : <FiChevronDown className="text-[#718096]" />}
        </div>
      </button>
      {open && (
        <pre className="mt-2 whitespace-pre-wrap font-sans text-xs text-[#4A5568] bg-[#F7F8FC] rounded-lg p-3 max-h-64 overflow-y-auto">
          {mail.BODY_TEXT || "(no text stored)"}{mail.ERROR ? `\n\nError: ${mail.ERROR}` : ""}
        </pre>
      )}
    </div>
  );
};

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : null;

const Select = ({ label, value, onChange, options }) => (
  <label className="flex flex-col gap-1 text-xs font-semibold text-[#718096]">
    {label}
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-3 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm font-normal text-[#1A202C] focus:ring-2 focus:ring-[#FF9900] focus:outline-none"
    >
      {options.map(([key, text]) => (
        <option key={key} value={key}>{text}</option>
      ))}
    </select>
  </label>
);

const TeamsSection = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [selected, setSelected] = useState(null);
  const [history, setHistory] = useState(null); // members, submissions with reviews, mails of the open team
  const [changingPassword, setChangingPassword] = useState(false);
  // ?team=<id> (e.g. from a submission page) opens that team's details straight away
  const [searchParams, setSearchParams] = useSearchParams();
  const linkedTeamId = searchParams.get("team");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    axios.get(`${URL}/admin/teams`, { withCredentials: true })
      .then((res) => {
        setTeams(res.data || []);
        const linked = linkedTeamId && (res.data || []).find((t) => String(t.ID) === String(linkedTeamId));
        if (linked) setSelected(linked);
      })
      .catch(() => setError("Could not load teams"))
      .finally(() => setLoading(false));
  }, []);

  // the full record (also for graduated teams) is loaded when a team is opened
  useEffect(() => {
    if (!selected) return;
    setHistory(null);
    axios.get(`${URL}/admin/teams/${selected.ID}/history`, { withCredentials: true })
      .then((res) => setHistory(res.data))
      .catch(() => setHistory({ members: [], submissions: [], mails: [], error: true }));
  }, [selected]);

  // Escape closes the team details
  useEffect(() => {
    if (!selected) return undefined;
    const onKey = (e) => e.key === "Escape" && !changingPassword && closeDetails();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, changingPassword]);

  function closeDetails() {
    setSelected(null);
    if (searchParams.get("team")) {
      const next = new URLSearchParams(searchParams);
      next.delete("team");
      setSearchParams(next, { replace: true });
    }
  }

  const setFilter = (key) => (value) => setFilters((prev) => ({ ...prev, [key]: value }));

  const colleges = useMemo(
    () => [...new Set(teams.map((t) => t.COLLEGE).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [teams]
  );

  const filtered = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return teams
      .filter((t) => !q || [t.NAME, t.LEAD_EMAIL, t.LEAD_PHONE, t.MENTOR_NAME, t.MENTOR_EMAIL, t.SPOC_NAME, t.SPOC_EMAIL, t.COLLEGE, t.COLLEGE_CODE, t.ID]
        .some((v) => String(v ?? "").toLowerCase().includes(q)))
      .filter((t) => filters.status === "all" || teamState(t) === filters.status)
      .filter((t) => filters.college === "all" || t.COLLEGE === filters.college)
      .filter((t) => filters.submissions === "all"
        || (filters.submissions === "with" ? t.SUBMISSION_COUNT > 0 : t.SUBMISSION_COUNT === 0))
      .filter((t) => filters.problem === "all"
        || (filters.problem === "assigned" && t.ASSIGNED_COUNT > 0)
        || (filters.problem === "requested" && t.REQUESTED_COUNT > 0)
        || (filters.problem === "none" && t.ASSIGNED_COUNT === 0 && t.REQUESTED_COUNT === 0))
      .filter((t) => filters.evaluation === "all"
        || (filters.evaluation === "evaluated" && t.EVALUATED_COUNT > 0)
        || (filters.evaluation === "awaiting" && t.SUBMISSION_COUNT > t.EVALUATED_COUNT))
      .sort((a, b) => {
        if (filters.sort === "name") return String(a.NAME || "").localeCompare(String(b.NAME || ""));
        if (filters.sort === "submissions") return (b.SUBMISSION_COUNT - a.SUBMISSION_COUNT) || (b.ID - a.ID);
        if (filters.sort === "oldest") return a.ID - b.ID;
        return b.ID - a.ID;
      });
  }, [teams, filters]);

  const { page, setPage, pageItems, total, totalPages } = usePagination(filtered, { resetKey: JSON.stringify(filters) });
  // the open team's lists in the popup, 25 per page each (back to page 1 for another team)
  const problemPages = usePagination(selected?.problems || [], { resetKey: selected?.ID });
  const historyPages = usePagination(history?.submissions || [], { resetKey: selected?.ID });
  const mailPages = usePagination(history?.mails || [], { resetKey: selected?.ID });
  const filtersActive = JSON.stringify(filters) !== JSON.stringify(EMPTY_FILTERS);

  const stats = [
    ["Registered teams", teams.length, FiUsers],
    ["With a problem assigned", teams.filter((t) => t.ASSIGNED_COUNT > 0).length, FiClipboard],
    ["Have submitted", teams.filter((t) => t.SUBMISSION_COUNT > 0).length, FiUpload],
    ["Reviewed", teams.filter((t) => t.EVALUATED_COUNT > 0).length, FiCheckCircle],
    ["Graduated (archived)", teams.filter((t) => teamState(t) === "graduated").length, FiAward],
    ["Removed by SPOC", teams.filter((t) => teamState(t) === "removed").length, FiArchive],
  ];

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        {stats.map(([label, value, Icon]) => (
          <div key={label} className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-4 flex items-center gap-3">
            <div className="bg-[#FFF4E5] p-3 rounded-xl">
              <Icon className="text-[#FF9900] text-xl" />
            </div>
            <div>
              <p className="text-xs text-[#718096]">{label}</p>
              <p className="text-2xl font-bold text-[#1A202C]">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-4 mb-6 space-y-4">
        <div className="relative">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
          <input
            type="text"
            placeholder="Search by team, lead email or phone, mentor, SPOC or college..."
            className="w-full pl-11 pr-4 py-3 bg-white border border-[#E2E8F0] rounded-xl text-base focus:ring-2 focus:ring-[#FF9900] focus:outline-none placeholder-gray-400"
            value={filters.search}
            onChange={(e) => setFilter("search")(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3 items-end">
          <Select label="Status" value={filters.status} onChange={setFilter("status")} options={STATUS_FILTERS} />
          <Select label="College" value={filters.college} onChange={setFilter("college")} options={[["all", "All colleges"], ...colleges.map((c) => [c, c])]} />
          <Select label="Submissions" value={filters.submissions} onChange={setFilter("submissions")} options={SUBMISSION_FILTERS} />
          <Select label="Problem statement" value={filters.problem} onChange={setFilter("problem")} options={PROBLEM_FILTERS} />
          <Select label="Review" value={filters.evaluation} onChange={setFilter("evaluation")} options={EVALUATION_FILTERS} />
          <Select label="Sort by" value={filters.sort} onChange={setFilter("sort")} options={SORTS} />
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-[#718096]">
            {filtersActive ? `${filtered.length} of ${teams.length} teams match` : `${teams.length} teams`}
          </span>
          {filtersActive && (
            <button onClick={() => setFilters(EMPTY_FILTERS)} className="flex items-center gap-1.5 text-[#FF9900] font-medium hover:underline">
              <FiRotateCcw /> Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow-sm rounded-2xl border border-[#E2E8F0] overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-[#F7F8FC] text-[#718096]">
            <tr>
              <th className="text-left py-3 px-4 font-semibold">Team</th>
              <th className="text-left py-3 px-4 font-semibold">College / SPOC</th>
              <th className="text-left py-3 px-4 font-semibold">Team lead</th>
              <th className="text-center py-3 px-4 font-semibold">Members</th>
              <th className="text-center py-3 px-4 font-semibold">Problems</th>
              <th className="text-center py-3 px-4 font-semibold">Submissions</th>
              <th className="text-left py-3 px-4 font-semibold">Graduation</th>
              <th className="text-left py-3 px-4 font-semibold">Registered</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" className="py-6 text-center text-[#A0AEC0] italic">Loading teams...</td></tr>
            ) : error ? (
              <tr><td colSpan="8" className="py-6 text-center text-red-500">{error}</td></tr>
            ) : pageItems.length > 0 ? (
              pageItems.map((t) => (
                <tr key={t.ID} onClick={() => setSelected(t)} className="border-t border-[#E2E8F0] hover:bg-orange-50/40 cursor-pointer transition-all">
                  <td className="py-3 px-4">
                    <div className="font-medium text-[#1A202C]">{t.NAME || "-"}</div>
                    <div className="text-xs text-[#A0AEC0]">ID {t.ID}{!t.HAS_LOGIN && " · no login yet"}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-[#1A202C]">{t.COLLEGE || "-"}</div>
                    <div className="text-xs text-[#718096]">{t.SPOC_NAME || t.SPOC_EMAIL || "No SPOC"}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-[#1A202C] break-all">{t.LEAD_EMAIL || "-"}</div>
                    {t.LEAD_PHONE && <div className="text-xs text-[#718096]">{t.LEAD_PHONE}</div>}
                  </td>
                  <td className="py-3 px-4 text-center text-[#1A202C]">{t.MEMBER_COUNT}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="text-[#1A202C] font-medium">{t.ASSIGNED_COUNT}</span>
                    {t.REQUESTED_COUNT > 0 && <span className="block text-xs text-[#C05621]">{t.REQUESTED_COUNT} requested</span>}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {t.SUBMISSION_COUNT > 0 ? (
                      <>
                        <span className="font-medium text-[#1A202C]">{t.SUBMISSION_COUNT}</span>
                        <span className="block text-xs text-[#718096]">{t.EVALUATED_COUNT} reviewed</span>
                      </>
                    ) : (
                      <span className="text-[#A0AEC0]">None</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {t.REMOVED_AT ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-700 whitespace-nowrap" title={`Removed ${formatDate(t.REMOVED_AT)}`}>
                        <FiArchive /> Removed{t.GRADUATION_YEAR ? ` · ${t.GRADUATION_YEAR}` : ""}
                      </span>
                    ) : t.GRADUATED_AT ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 whitespace-nowrap">
                        <FiAward /> Graduated {t.GRADUATION_YEAR}
                      </span>
                    ) : t.GRADUATION_YEAR ? (
                      <span className="text-[#1A202C]">{t.GRADUATION_YEAR}</span>
                    ) : (
                      <span className="text-[#A0AEC0]">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-[#718096]">{formatDate(t.CREATED_AT) || "—"}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="8" className="py-6 text-center text-[#A0AEC0] italic">{teams.length ? "No teams match these filters." : "No teams registered yet."}</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={totalPages} total={total} onChange={setPage} label="teams" />

      {selected && changingPassword && (
        <ChangePasswordModal
          title="Change team login password"
          subtitle={`${selected.NAME} · login ${selected.LEAD_EMAIL}`}
          emailLabel="Email the new password to the team lead"
          onSave={async (password, emailUser) => {
            await axios.post(`${URL}/team_password`, { teamId: selected.ID, password, emailUser }, { withCredentials: true });
            setChangingPassword(false);
            setNotice(`Password changed${emailUser ? " and emailed to the team lead" : ""}.`);
          }}
          onClose={() => setChangingPassword(false)}
        />
      )}

      {/* Team details */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={closeDetails}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-[#E2E8F0] px-6 py-4 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold text-[#1A202C]">{selected.NAME}</h2>
                <p className="text-sm text-[#718096]">{selected.COLLEGE || "No college"} · Team ID {selected.ID}</p>
                {selected.REMOVED_AT ? (
                  <span className="inline-flex items-center gap-1 mt-2 px-2 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-700">
                    <FiArchive /> Removed by {selected.REMOVED_BY_EMAIL || "the SPOC"} on {formatDate(selected.REMOVED_AT)} · records kept · read-only
                  </span>
                ) : selected.GRADUATED_AT && (
                  <span className="inline-flex items-center gap-1 mt-2 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    <FiAward /> Graduated {selected.GRADUATION_YEAR} · archived {formatDate(selected.GRADUATED_AT)} · read-only
                  </span>
                )}
              </div>
              <button onClick={closeDetails} className="text-gray-400 hover:text-gray-600 p-1" aria-label="Close">
                <FiX size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <table className="w-full text-sm">
                <tbody>
                  {[
                    ["Team lead", selected.LEAD_EMAIL],
                    ["Lead phone", selected.LEAD_PHONE],
                    ["Team login", selected.REMOVED_AT ? "Closed (team removed)" : selected.GRADUATED_AT ? "Closed (graduated)" : selected.HAS_LOGIN ? "Created" : "Not created yet"],
                    ["Graduation year", selected.GRADUATION_YEAR ? `${selected.GRADUATION_YEAR} (highest member year)` : "Not set"],
                    ["Mentor", [selected.MENTOR_NAME, selected.MENTOR_EMAIL].filter(Boolean).join(" · ")],
                    ["SPOC", [selected.SPOC_NAME, selected.SPOC_EMAIL].filter(Boolean).join(" · ")],
                    ["College code", selected.COLLEGE_CODE],
                    ["Registered", formatDate(selected.CREATED_AT)],
                  ].filter(([, v]) => v).map(([label, value]) => (
                    <tr key={label} className="border-b border-[#E2E8F0]">
                      <td className="py-2 pr-4 font-medium text-[#718096] w-1/3">{label}</td>
                      <td className="py-2 text-[#1A202C] break-all">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {selected.HAS_LOGIN && !selected.GRADUATED_AT && (
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => { setNotice(""); setChangingPassword(true); }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#FF9900] text-[#FF9900] text-sm font-medium hover:bg-[#FF9900] hover:text-white transition"
                  >
                    <FiKey /> Change team login password
                  </button>
                  {notice && <span className="text-sm text-green-600">{notice}</span>}
                </div>
              )}

              <div>
                <h3 className="font-semibold text-[#1A202C] mb-2">Members</h3>
                {history === null ? (
                  <p className="text-sm text-[#A0AEC0]">Loading members...</p>
                ) : history.members.length === 0 ? (
                  <p className="text-sm text-[#A0AEC0]">No members recorded.</p>
                ) : (
                  <div className="border border-[#E2E8F0] rounded-xl divide-y divide-[#E2E8F0]">
                    {history.members.map((m) => (
                      <div key={m.ID} className="px-4 py-2.5 flex flex-wrap justify-between gap-2 text-sm">
                        <div>
                          <span className="font-medium text-[#1A202C]">{m.NAME}</span>
                          <span className="ml-2 text-xs text-[#718096]">{m.ROLE}</span>
                          {m.GRAD_YEAR && <span className="ml-2 text-xs font-medium text-purple-700">Class of {m.GRAD_YEAR}</span>}
                        </div>
                        <div className="text-[#718096] break-all">{[m.EMAIL, m.PHONE].filter(Boolean).join(" · ")}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-semibold text-[#1A202C] mb-2">Problem statements & submissions</h3>
                {selected.problems.length === 0 ? (
                  <p className="text-sm text-[#A0AEC0]">No problem statement requested or assigned yet.</p>
                ) : (
                  <div className="border border-[#E2E8F0] rounded-xl divide-y divide-[#E2E8F0]">
                    {problemPages.pageItems.map((p) => (
                      <div key={p.PROBLEM_ID} className="px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-sm">
                        <div className="min-w-0">
                          <Link to={`/admin/problems/${p.PROBLEM_ID}/details`} className="font-medium text-[#2B6CB0] hover:underline">
                            SFS_{p.PROBLEM_ID} · {p.TITLE || "Deleted problem"}
                          </Link>
                          <div className="text-xs text-[#718096]">
                            {p.ASSIGNMENT_STATUS ? p.ASSIGNMENT_STATUS.charAt(0) + p.ASSIGNMENT_STATUS.slice(1).toLowerCase() : "Not assigned"}
                          </div>
                        </div>
                        {p.submission ? (
                          <Link
                            to={`/admin/submissions/${p.submission.ID}/details`}
                            className="flex items-center gap-2"
                          >
                            <StatusBadge status={p.submission.STATUS} />
                            {p.submission.TOTAL != null && <span className="font-medium text-[#1A202C]">{p.submission.TOTAL}/100</span>}
                            <span className="text-[#FF9900] font-medium hover:underline">{p.submission.STATUS === "PENDING" ? "Review" : "View"}</span>
                          </Link>
                        ) : (
                          <span className="text-xs text-[#A0AEC0]">No submission</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <Pagination page={problemPages.page} totalPages={problemPages.totalPages} total={problemPages.total} onChange={problemPages.setPage} label="problem statements" />
              </div>

              <div>
                <h3 className="font-semibold text-[#1A202C] mb-2">Submission & review history</h3>
                {history === null ? (
                  <p className="text-sm text-[#A0AEC0]">Loading history...</p>
                ) : history.submissions.length === 0 ? (
                  <p className="text-sm text-[#A0AEC0]">No submissions.</p>
                ) : (
                  <div className="space-y-3">
                    {historyPages.pageItems.map((sub) => (
                      <div key={sub.ID} className="border border-[#E2E8F0] rounded-xl p-4 text-sm">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="font-medium text-[#1A202C]">{sub.SOL_TITLE || "Untitled solution"}</div>
                            <div className="text-xs text-[#718096]">SFS_{sub.PROBLEM_ID} · {sub.PROBLEM_TITLE || "Deleted problem"} · submitted {formatDate(sub.SUB_DATE)}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <StatusBadge status={sub.STATUS} />
                            <Link to={`/admin/submissions/${sub.ID}/details`} className="text-[#FF9900] font-medium hover:underline">Open</Link>
                          </div>
                        </div>
                        {sub.reviews.length > 0 && (
                          <ol className="mt-3 space-y-2 border-l-2 border-[#E2E8F0] pl-3">
                            {sub.reviews.map((r) => (
                              <li key={r.ID}>
                                <div className="flex flex-wrap items-center gap-2 text-xs">
                                  <StatusBadge status={r.DECISION} />
                                  <span className="text-[#4A5568] break-all">{r.REVIEWER_EMAIL || r.REVIEWER_NAME || "Deleted user"}</span>
                                  <span className="text-[#A0AEC0]">{formatDateTime(r.REVIEWED_AT)}</span>
                                  {r.EVAL_TOTAL != null && <span className="font-semibold text-[#1A202C]">{r.EVAL_TOTAL}/100</span>}
                                </div>
                                {r.COMMENT && <p className="mt-1 text-[#1A202C] whitespace-pre-line">{r.COMMENT}</p>}
                              </li>
                            ))}
                          </ol>
                        )}
                      </div>
                    ))}
                    <Pagination page={historyPages.page} totalPages={historyPages.totalPages} total={historyPages.total} onChange={historyPages.setPage} label="submissions" />
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-semibold text-[#1A202C] mb-2 flex items-center gap-2"><FiMail /> Communications</h3>
                <p className="text-xs text-[#A0AEC0] mb-2">Emails the platform sent to the team's addresses (lead, members, mentor). Click one to read it.</p>
                {history === null ? (
                  <p className="text-sm text-[#A0AEC0]">Loading emails...</p>
                ) : history.mails.length === 0 ? (
                  <p className="text-sm text-[#A0AEC0]">No emails on record.</p>
                ) : (
                  <>
                    <div className="border border-[#E2E8F0] rounded-xl divide-y divide-[#E2E8F0]">
                      {mailPages.pageItems.map((m) => <MailItem key={m.ID} mail={m} />)}
                    </div>
                    <Pagination page={mailPages.page} totalPages={mailPages.totalPages} total={mailPages.total} onChange={mailPages.setPage} label="emails" />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamsSection;
