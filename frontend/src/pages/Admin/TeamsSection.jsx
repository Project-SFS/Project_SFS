import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useSearchParams } from "react-router-dom";
import { FiSearch, FiUsers, FiUpload, FiCheckCircle, FiClipboard, FiRotateCcw, FiAward, FiArchive } from "react-icons/fi";
import { URL } from "../../Utils";
import Pagination, { usePagination } from "../../components/common/Pagination";
import TeamDetailsModal from "../../components/admin/TeamDetailsModal";

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
  // ?team=<id> (e.g. from a submission page) opens that team's details straight away
  const [searchParams, setSearchParams] = useSearchParams();
  const linkedTeamId = searchParams.get("team");

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

      {/* Team details */}
      {selected && <TeamDetailsModal team={selected} onClose={closeDetails} />}
    </div>
  );
};

export default TeamsSection;
