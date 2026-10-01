import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import {
  FiSearch, FiCalendar, FiClock, FiTag, FiX, FiLayers, FiCpu, FiTarget, FiList, FiRotateCcw, FiFileText,
} from "react-icons/fi";
import Header from "./Header";
import Footer from "./Footer";
import Pagination, { usePagination } from "./common/Pagination";
import { URL } from "../Utils";

// Every published problem statement as cards, with search, filters and a details popup.
// Used on the public page (showHeader) and inside the SPOC dashboard (showHeader = false).
const fetchProblems = async () => {
  const response = await axios.get(`${URL}/get_problems`, { timeout: 8000, withCredentials: true });
  return response.data.problems;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const dayOf = (value) => (value ? String(value).slice(0, 10) : null);
const todayIso = () => new Date().toLocaleDateString("en-CA");
const readableDate = (day) => (day ? new Date(`${day}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "No deadline");

// days until the deadline (0 = today, negative = closed, null = no deadline)
const daysLeft = (deadline) => {
  const day = dayOf(deadline);
  if (!day) return null;
  return Math.round((new Date(`${day}T00:00:00`) - new Date(`${todayIso()}T00:00:00`)) / DAY_MS);
};

const deadlineBadge = (deadline) => {
  const left = daysLeft(deadline);
  if (left === null) return { text: "Open", cls: "bg-green-100 text-green-800" };
  if (left < 0) return { text: "Closed", cls: "bg-gray-200 text-gray-600" };
  if (left === 0) return { text: "Last day", cls: "bg-red-100 text-red-700" };
  if (left <= 7) return { text: `${left} day${left === 1 ? "" : "s"} left`, cls: "bg-orange-100 text-orange-800" };
  return { text: `Open · ${left} days left`, cls: "bg-green-100 text-green-800" };
};

const titleCase = (value) => (value ? String(value).charAt(0).toUpperCase() + String(value).slice(1) : "");

const SORTS = [
  ["newest", "Newest first"],
  ["deadline", "Deadline: soonest first"],
  ["title", "Title A–Z"],
];
const EMPTY_FILTERS = { search: "", category: "all", status: "all", domain: "all", sort: "newest" };

const ProblemStatements = ({ showHeader = true, allowSubmit = true }) => {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [selected, setSelected] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProblems()
      .then((data) => setProblems(Array.isArray(data) ? data : []))
      .catch(() => setError("The problem statements could not be loaded. Please try again later."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selected) return undefined;
    const onKey = (e) => e.key === "Escape" && setSelected(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  const setFilter = (key) => (value) => setFilters((prev) => ({ ...prev, [key]: value }));
  const categories = useMemo(() => [...new Set(problems.map((p) => String(p.CATEGORY || "").toLowerCase()).filter(Boolean))].sort(), [problems]);
  const domains = useMemo(() => [...new Set(problems.map((p) => p.DOMAIN).filter(Boolean))].sort((a, b) => a.localeCompare(b)), [problems]);
  const openCount = problems.filter((p) => (daysLeft(p.SUB_DEADLINE) ?? 1) >= 0).length;

  const visible = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return problems
      .filter((p) => !q || [p.TITLE, p.DESCRIPTION, p.DOMAIN, p.TECHNOLOGY, `SFS_${p.ID}`].some((v) => String(v || "").toLowerCase().includes(q)))
      .filter((p) => filters.category === "all" || String(p.CATEGORY || "").toLowerCase() === filters.category)
      .filter((p) => filters.domain === "all" || p.DOMAIN === filters.domain)
      .filter((p) => {
        if (filters.status === "all") return true;
        const left = daysLeft(p.SUB_DEADLINE);
        return filters.status === "open" ? left === null || left >= 0 : left !== null && left < 0;
      })
      .sort((a, b) => {
        if (filters.sort === "title") return String(a.TITLE || "").localeCompare(String(b.TITLE || ""));
        if (filters.sort === "deadline") {
          // open problems with the nearest deadline first, then no deadline, then closed ones
          const rank = (l) => (l === null ? 1e6 : l < 0 ? 1e7 - l : l);
          return rank(daysLeft(a.SUB_DEADLINE)) - rank(daysLeft(b.SUB_DEADLINE));
        }
        return Number(b.ID) - Number(a.ID);
      });
  }, [problems, filters]);

  const { page, setPage, pageItems, total, totalPages } = usePagination(visible, { resetKey: JSON.stringify(filters) });
  const filtersActive = JSON.stringify(filters) !== JSON.stringify(EMPTY_FILTERS);

  const select = "px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-[#fc9300]";

  return (
    <div className={showHeader ? "min-h-screen flex flex-col bg-gray-50" : ""}>
      {showHeader && <Header />}

      <div className={showHeader ? "flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 pt-28 pb-16" : ""}>
        {/* Heading */}
        {showHeader ? (
          <div className="text-center mb-10">
            <div className="inline-flex items-center rounded-full border border-[#fc9300]/40 bg-[#fff7ec] px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-[#fc9300] mb-3">
              Solve For Sakthi
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">Explore Challenges</h1>
            <p className="text-gray-600 mt-3 max-w-2xl mx-auto">
              Real challenges from Sakthi Auto. Pick the one that matches your team's skills and interests, then request it through your SPOC.
            </p>
          </div>
        ) : (
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Problem Statements</h1>
            <p className="text-gray-600 mt-1">Every published problem statement. Assign them to your teams under Team Progress.</p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            ["Problem statements", problems.length, FiFileText],
            ["Open for submissions", openCount, FiClock],
            ["Categories", categories.length, FiTag],
            ["Domains", domains.length, FiLayers],
          ].map(([label, value, Icon]) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
              <div className="bg-orange-50 p-3 rounded-xl"><Icon className="text-[#fc9300] text-lg" /></div>
              <div>
                <div className="text-xs text-gray-500">{label}</div>
                <div className="text-2xl font-bold text-gray-900">{loading ? "–" : value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6 space-y-3">
          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilter("search")(e.target.value)}
              placeholder="Search by title, description, domain, technology or SFS ID..."
              className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-[#fc9300]"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select aria-label="Category" value={filters.category} onChange={(e) => setFilter("category")(e.target.value)} className={select}>
              <option value="all">All categories</option>
              {categories.map((c) => <option key={c} value={c}>{titleCase(c)}</option>)}
            </select>
            <select aria-label="Status" value={filters.status} onChange={(e) => setFilter("status")(e.target.value)} className={select}>
              <option value="all">Open and closed</option>
              <option value="open">Open only</option>
              <option value="closed">Closed only</option>
            </select>
            {domains.length > 0 && (
              <select aria-label="Domain" value={filters.domain} onChange={(e) => setFilter("domain")(e.target.value)} className={select}>
                <option value="all">All domains</option>
                {domains.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            )}
            <select aria-label="Sort" value={filters.sort} onChange={(e) => setFilter("sort")(e.target.value)} className={select}>
              {SORTS.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select>
            <span className="text-sm text-gray-500 ml-auto">
              {loading ? "" : filtersActive ? `${visible.length} of ${problems.length} match` : `${problems.length} problem statements`}
            </span>
            {filtersActive && (
              <button onClick={() => setFilters(EMPTY_FILTERS)} className="flex items-center gap-1.5 text-sm font-medium text-[#fc9300] hover:underline">
                <FiRotateCcw /> Clear
              </button>
            )}
          </div>
        </div>

        {/* Cards */}
        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
                <div className="h-3 w-16 bg-gray-200 rounded mb-3" />
                <div className="h-5 w-3/4 bg-gray-200 rounded mb-3" />
                <div className="h-3 w-full bg-gray-100 rounded mb-2" />
                <div className="h-3 w-5/6 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-white rounded-2xl border border-red-200 p-8 text-center text-red-600">{error}</div>
        ) : visible.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-600">
            {problems.length ? "No problem statements match your search or filters." : "No problem statements have been published yet."}
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {pageItems.map((p, index) => {
              const badge = deadlineBadge(p.SUB_DEADLINE);
              return (
                <motion.article
                  key={p.ID}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index, 12) * 0.03 }}
                  className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-orange-200 transition flex flex-col"
                >
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-bold text-[#fc9300]">SFS_{p.ID}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${badge.cls}`}>{badge.text}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 leading-snug line-clamp-2 group-hover:text-[#c76f00] [overflow-wrap:anywhere]">{p.TITLE}</h3>
                    {p.DESCRIPTION && <p className="text-sm text-gray-600 mt-2 line-clamp-3 whitespace-pre-line [overflow-wrap:anywhere]">{p.DESCRIPTION}</p>}
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {p.CATEGORY && <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-xs font-medium text-gray-700">{titleCase(p.CATEGORY)}</span>}
                      {p.DOMAIN && <span className="px-2.5 py-0.5 rounded-full bg-orange-50 text-xs font-medium text-[#c76f00]">{p.DOMAIN}</span>}
                      {p.TECHNOLOGY && <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-xs font-medium text-blue-700 truncate max-w-[12rem]" title={p.TECHNOLOGY}>{p.TECHNOLOGY}</span>}
                    </div>
                  </div>
                  <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between gap-2">
                    <span className="text-sm text-gray-500 flex items-center gap-1.5"><FiCalendar /> {readableDate(dayOf(p.SUB_DEADLINE))}</span>
                    <button onClick={() => setSelected(p)} className="px-3.5 py-1.5 rounded-lg bg-[#fc9300] text-white text-sm font-medium hover:bg-[#e68400] transition">
                      View details
                    </button>
                  </div>
                </motion.article>
              );
            })}
          </div>
        )}
        <Pagination page={page} totalPages={totalPages} total={total} onChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }} label="problem statements" />
      </div>

      {showHeader && <Footer />}

      {/* Details */}
      <AnimatePresence>
        {selected && (
          <motion.div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelected(null)}>
            <motion.div
              className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col"
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 24, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-[#fc9300]">SFS_{selected.ID}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${deadlineBadge(selected.SUB_DEADLINE).cls}`}>{deadlineBadge(selected.SUB_DEADLINE).text}</span>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 [overflow-wrap:anywhere]">{selected.TITLE}</h2>
                </div>
                <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100" aria-label="Close"><FiX size={20} /></button>
              </div>

              <div className="px-6 py-5 overflow-y-auto space-y-5 text-sm text-gray-700">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    [FiCalendar, "Deadline", readableDate(dayOf(selected.SUB_DEADLINE))],
                    [FiTag, "Category", titleCase(selected.CATEGORY) || "—"],
                    [FiLayers, "Domain", selected.DOMAIN || "—"],
                  ].map(([Icon, label, value]) => (
                    <div key={label} className="rounded-xl bg-gray-50 px-4 py-3">
                      <div className="text-xs text-gray-500 flex items-center gap-1.5"><Icon /> {label}</div>
                      <div className="font-semibold text-gray-900 mt-0.5">{value}</div>
                    </div>
                  ))}
                </div>
                {[
                  [FiFileText, "Problem description", selected.DESCRIPTION],
                  [FiTarget, "Expected outcomes", selected.EXPECTED_OUTCOMES],
                  [FiList, "Requirements", selected.REQUIREMENTS],
                  [FiCpu, "Technology", selected.TECHNOLOGY],
                ].filter(([, , v]) => v).map(([Icon, label, value]) => (
                  <div key={label}>
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-1"><Icon className="text-[#fc9300]" /> {label}</h3>
                    <p className="leading-relaxed whitespace-pre-line [overflow-wrap:anywhere]">{value}</p>
                  </div>
                ))}
              </div>

              <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                <button onClick={() => setSelected(null)} className="px-4 py-2 rounded-xl bg-gray-100 text-gray-800 text-sm hover:bg-gray-200">Close</button>
                {allowSubmit && (daysLeft(selected.SUB_DEADLINE) ?? 1) >= 0 && (
                  <button
                    onClick={() => navigate(`/student/submit-solution?${new URLSearchParams({ problemId: selected.ID })}`)}
                    className="px-4 py-2 rounded-xl bg-[#fc9300] text-white text-sm font-semibold hover:bg-[#e68400]"
                  >
                    Submit solution
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProblemStatements;
