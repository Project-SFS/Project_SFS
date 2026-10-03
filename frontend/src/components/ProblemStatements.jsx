import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import {
  FiSearch, FiClock, FiTag, FiX, FiLayers, FiCpu, FiTarget, FiList, FiRotateCcw, FiFileText, FiCode, FiLink,
} from "react-icons/fi";
import Header from "./Header";
import Footer from "./Footer";
import Pagination, { usePagination } from "./common/Pagination";
import { URL } from "../Utils";
import { copyText } from "../submissionFiles";

// Every published challenge as a list, with search, filters and a details popup.
// Used on the public page (showHeader) and inside the SPOC dashboard (showHeader = false).
const fetchProblems = async () => {
  const response = await axios.get(`${URL}/get_problems`, { timeout: 8000, withCredentials: true });
  return response.data.problems;
};

// No deadlines: a challenge is open until an admin closes it, then it shows as "Concept Received"
const isOpen = (p) => !p.IS_CLOSED;
const statusBadge = (p) => (isOpen(p)
  ? { text: "Open", cls: "bg-green-100 text-green-800" }
  : { text: "Concept Received", cls: "bg-gray-200 text-gray-700" });

const titleCase = (value) => (value ? String(value).charAt(0).toUpperCase() + String(value).slice(1) : "");

const SORTS = [
  ["newest", "Newest first"],
  ["open", "Open challenges first"],
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
  const [searchParams, setSearchParams] = useSearchParams();
  const [copied, setCopied] = useState(false);

  // shareable link: /problemstatements?problem=133 opens that problem's details (on any domain)
  const problemLink = (p) => `${window.location.origin}/problemstatements?problem=${p.ID}`;
  const openProblem = (p) => {
    setSelected(p);
    if (showHeader) setSearchParams((prev) => { const next = new URLSearchParams(prev); next.set("problem", p.ID); return next; }, { replace: true });
  };
  const closeProblem = () => {
    setSelected(null);
    setCopied(false);
    if (showHeader && searchParams.get("problem")) setSearchParams((prev) => { const next = new URLSearchParams(prev); next.delete("problem"); return next; }, { replace: true });
  };

  useEffect(() => {
    fetchProblems()
      .then((data) => setProblems(Array.isArray(data) ? data : []))
      .catch(() => setError("The challenges could not be loaded. Please try again later."))
      .finally(() => setLoading(false));
  }, []);

  // open the problem named in the link once the list has loaded
  useEffect(() => {
    const wanted = searchParams.get("problem");
    if (!wanted || !problems.length || selected) return;
    const match = problems.find((p) => String(p.ID) === String(wanted).replace(/^SFS_/i, ""));
    if (match) setSelected(match);
  }, [problems, searchParams, selected]);

  useEffect(() => {
    if (!selected) return undefined;
    const onKey = (e) => e.key === "Escape" && closeProblem();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  const setFilter = (key) => (value) => setFilters((prev) => ({ ...prev, [key]: value }));
  const categories = useMemo(() => [...new Set(problems.map((p) => String(p.CATEGORY || "").toLowerCase()).filter(Boolean))].sort(), [problems]);
  const domains = useMemo(() => [...new Set(problems.map((p) => p.DOMAIN).filter(Boolean))].sort((a, b) => a.localeCompare(b)), [problems]);
  const countCategory = (c) => problems.filter((p) => String(p.CATEGORY || "").toLowerCase() === c).length;
  const openCount = problems.filter(isOpen).length;

  const visible = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return problems
      .filter((p) => !q || [p.TITLE, p.DESCRIPTION, p.DOMAIN, p.TECHNOLOGY, `SFS_${p.ID}`].some((v) => String(v || "").toLowerCase().includes(q)))
      .filter((p) => filters.category === "all" || String(p.CATEGORY || "").toLowerCase() === filters.category)
      .filter((p) => filters.domain === "all" || p.DOMAIN === filters.domain)
      .filter((p) => {
        if (filters.status === "all") return true;
        return filters.status === "open" ? isOpen(p) : !isOpen(p);
      })
      .sort((a, b) => {
        if (filters.sort === "title") return String(a.TITLE || "").localeCompare(String(b.TITLE || ""));
        if (filters.sort === "open") return (Number(isOpen(b)) - Number(isOpen(a))) || (Number(b.ID) - Number(a.ID));
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
              Real challenges from Sakthi Auto. Pick the ones that match your team's skills and interests and submit your solution while the challenge is open.
            </p>
          </div>
        ) : (
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Challenges</h1>
            <p className="text-gray-600 mt-1">Every published challenge. Your teams can submit solutions to any open challenge; see their progress under Team Progress.</p>
          </div>
        )}

        {/* Stats: total, per category, open. The category cards also filter the list. */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          {[
            { label: "Challenges", value: problems.length, Icon: FiFileText, filter: { category: "all", status: "all" } },
            { label: "Hardware", value: countCategory("hardware"), Icon: FiCpu, filter: { category: "hardware" } },
            { label: "Software", value: countCategory("software"), Icon: FiCode, filter: { category: "software" } },
            { label: "Combined", value: countCategory("combined"), Icon: FiLayers, filter: { category: "combined" } },
            { label: "Open for submission", value: openCount, Icon: FiClock, filter: { status: "open" } },
          ].map(({ label, value, Icon, filter }) => {
            const active = Object.entries(filter).every(([k, v]) => filters[k] === v) && !(label === "Challenges" && filtersActive);
            return (
              <button
                type="button"
                key={label}
                onClick={() => setFilters((prev) => ({ ...prev, ...filter }))}
                className={`text-left bg-white rounded-2xl border shadow-sm p-4 flex items-center gap-3 transition hover:border-orange-300 ${active && label !== "Challenges" ? "border-[#fc9300] ring-2 ring-orange-100" : "border-gray-100"}`}
              >
                <div className="bg-orange-50 p-3 rounded-xl"><Icon className="text-[#fc9300] text-lg" /></div>
                <div>
                  <div className="text-xs text-gray-500">{label}</div>
                  <div className="text-2xl font-bold text-gray-900">{loading ? "–" : value}</div>
                </div>
              </button>
            );
          })}
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
              <option value="all">Open and Concept Received</option>
              <option value="open">Open only</option>
              <option value="closed">Concept Received only</option>
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
              {loading ? "" : filtersActive ? `${visible.length} of ${problems.length} match` : `${problems.length} challenges`}
            </span>
            {filtersActive && (
              <button onClick={() => setFilters(EMPTY_FILTERS)} className="flex items-center gap-1.5 text-sm font-medium text-[#fc9300] hover:underline">
                <FiRotateCcw /> Clear
              </button>
            )}
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-5 animate-pulse">
                <div className="h-3 w-16 bg-gray-200 rounded mb-3" />
                <div className="h-5 w-2/3 bg-gray-200 rounded mb-3" />
                <div className="h-3 w-full bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-white rounded-2xl border border-red-200 p-8 text-center text-red-600">{error}</div>
        ) : visible.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-600">
            {problems.length ? "No challenges match your search or filters." : "No challenges have been published yet."}
          </div>
        ) : (
          <ul className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100 overflow-hidden">
            {pageItems.map((p, index) => {
              const badge = statusBadge(p);
              return (
                <motion.li
                  key={p.ID}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index, 12) * 0.03 }}
                  className="group relative hover:bg-orange-50/40 transition"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#fc9300] opacity-0 group-hover:opacity-100 transition" />
                  <div className="px-5 py-4 sm:px-6 flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-[#fc9300]">SFS_{p.ID}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${badge.cls}`}>{badge.text}</span>
                        {p.CATEGORY && <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-xs font-medium text-gray-700">{titleCase(p.CATEGORY)}</span>}
                        {p.DOMAIN && <span className="px-2.5 py-0.5 rounded-full bg-orange-50 text-xs font-medium text-[#c76f00]">{p.DOMAIN}</span>}
                      </div>
                      <h3
                        onClick={() => openProblem(p)}
                        className="text-base sm:text-lg font-semibold text-gray-900 leading-snug cursor-pointer group-hover:text-[#c76f00] [overflow-wrap:anywhere]"
                      >
                        {p.TITLE}
                      </h3>
                      {p.DESCRIPTION && <p className="text-sm text-gray-600 mt-1 line-clamp-2 [overflow-wrap:anywhere]">{p.DESCRIPTION}</p>}
                      {p.TECHNOLOGY && (
                        <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1.5 min-w-0">
                          <FiCpu className="shrink-0" /> <span className="truncate" title={p.TECHNOLOGY}>{p.TECHNOLOGY}</span>
                        </p>
                      )}
                    </div>
                    <div className="flex items-center justify-between md:justify-end gap-4 shrink-0">
                      <button onClick={() => openProblem(p)} className="px-3.5 py-1.5 rounded-lg bg-[#fc9300] text-white text-sm font-medium hover:bg-[#e68400] transition whitespace-nowrap">
                        View details
                      </button>
                    </div>
                  </div>
                </motion.li>
              );
            })}
          </ul>
        )}
        <Pagination page={page} totalPages={totalPages} total={total} onChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }} label="challenges" />
      </div>

      {showHeader && <Footer />}

      {/* Details */}
      <AnimatePresence>
        {selected && (
          <motion.div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeProblem}>
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
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusBadge(selected).cls}`}>{statusBadge(selected).text}</span>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 [overflow-wrap:anywhere]">{selected.TITLE}</h2>
                </div>
                <button onClick={closeProblem} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100" aria-label="Close"><FiX size={20} /></button>
              </div>

              <div className="px-6 py-5 overflow-y-auto space-y-5 text-sm text-gray-700">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    [FiClock, "Status", isOpen(selected) ? "Open for solutions" : "Concept Received"],
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

              <div className="px-6 py-4 border-t border-gray-100 flex flex-wrap justify-end gap-3">
                <button
                  onClick={async () => { if (await copyText(problemLink(selected))) { setCopied(true); setTimeout(() => setCopied(false), 3000); } }}
                  className="mr-auto inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-gray-700 text-sm hover:bg-gray-50"
                  title={problemLink(selected)}
                >
                  <FiLink /> {copied ? "Link copied" : "Copy link"}
                </button>
                <button onClick={closeProblem} className="px-4 py-2 rounded-xl bg-gray-100 text-gray-800 text-sm hover:bg-gray-200">Close</button>
                {allowSubmit && isOpen(selected) && (
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
