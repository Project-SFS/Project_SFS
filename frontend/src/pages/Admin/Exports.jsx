import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import {
  FiDownload, FiArchive, FiFileText, FiUsers, FiUserCheck, FiFilter, FiColumns, FiChevronDown, FiX, FiRotateCcw, FiCheck, FiLayers,
} from "react-icons/fi";
import { URL } from "../../Utils";
import { downloadFile } from "../../downloadFile";

// Admin exports to Excel: submissions (one workbook, or a ZIP with one report per problem statement),
// teams and SPOCs. Every export has filters, a column choice and a live count of matching rows.

const TABS = [
  { key: "submissions", label: "Submissions", icon: FiFileText, hint: "Every submission with its problem, team, college, review, marks and comments" },
  { key: "teams", label: "Teams", icon: FiUsers, hint: "Every team with its members, SPOC, problems and results" },
  { key: "spocs", label: "SPOCs", icon: FiUserCheck, hint: "Every SPOC with their college, account status and activity" },
];

const STATUSES = [["PENDING", "Awaiting review"], ["CHANGES_REQUESTED", "Changes needed"], ["APPROVED", "Approved"], ["REJECTED", "Rejected"]];
const SPOC_STATUSES = [["ACTIVE", "Active"], ["PENDING", "Awaiting approval"], ["REJECTED", "Rejected"]];

const EMPTY = {
  submissions: { problemIds: [], statuses: [], colleges: [], reviewers: [], submittedFrom: "", submittedTo: "", reviewedFrom: "", reviewedTo: "", marksMin: "", marksMax: "", teamStatus: "all", search: "" },
  teams: { colleges: [], teamStatus: "all", submissions: "all", problemIds: [], graduationMatch: "upto", graduationYear: "", search: "" },
  spocs: { spocStatuses: [], colleges: [], hasTeams: "all", search: "" },
};
const DEFAULT_SHEETS = { summary: true, byProblem: true, all: true, reviewHistory: false, members: false, includeEmptyProblems: true };

const field = "w-full px-3 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#1A202C] focus:outline-none focus:ring-2 focus:ring-[#FF9900]/30 focus:border-[#FF9900]";
const lbl = "block text-xs font-semibold text-[#718096] mb-1";

// Dropdown with checkboxes and a search box; empty selection = everything
const MultiSelect = ({ label, options, value, onChange, placeholder = "All" }) => {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef(null);
  useEffect(() => {
    const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  const shown = options.filter(([, text]) => String(text).toLowerCase().includes(q.toLowerCase()));
  const toggle = (key) => onChange(value.includes(key) ? value.filter((v) => v !== key) : [...value, key]);
  const summary = value.length === 0 ? placeholder : value.length === 1 ? options.find(([k]) => k === value[0])?.[1] || value[0] : `${value.length} selected`;
  return (
    <div className="relative" ref={ref}>
      <span className={lbl}>{label}</span>
      <button type="button" onClick={() => setOpen(!open)} className={`${field} flex items-center justify-between gap-2 text-left`}>
        <span className={`truncate ${value.length ? "" : "text-[#A0AEC0]"}`}>{summary}</span>
        <FiChevronDown className="shrink-0 text-[#A0AEC0]" />
      </button>
      {open && (
        <div className="absolute z-30 mt-1 w-full min-w-[16rem] bg-white border border-[#E2E8F0] rounded-xl shadow-lg">
          {options.length > 6 && (
            <div className="p-2 border-b border-[#E2E8F0]">
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="w-full px-3 py-1.5 border border-[#E2E8F0] rounded-lg text-sm" />
            </div>
          )}
          <div className="max-h-60 overflow-y-auto py-1">
            {shown.length === 0 && <p className="px-3 py-2 text-sm text-[#A0AEC0]">Nothing to choose</p>}
            {shown.map(([key, text]) => (
              <label key={key} className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-orange-50 cursor-pointer">
                <input type="checkbox" checked={value.includes(key)} onChange={() => toggle(key)} className="accent-[#FF9900]" />
                <span className="truncate" title={text}>{text}</span>
              </label>
            ))}
          </div>
          {value.length > 0 && (
            <button type="button" onClick={() => onChange([])} className="w-full px-3 py-2 text-xs font-medium text-[#FF9900] border-t border-[#E2E8F0] hover:bg-orange-50 text-left">
              Clear selection
            </button>
          )}
        </div>
      )}
    </div>
  );
};

const Select = ({ label, value, onChange, options }) => (
  <label className="block">
    <span className={lbl}>{label}</span>
    <select value={value} onChange={(e) => onChange(e.target.value)} className={field}>
      {options.map(([k, t]) => <option key={k} value={k}>{t}</option>)}
    </select>
  </label>
);

const Exports = () => {
  const [tab, setTab] = useState("submissions");
  const [options, setOptions] = useState(null);
  const [filters, setFilters] = useState(EMPTY);
  const [columns, setColumns] = useState({ submissions: [], teams: [], spocs: [] });
  const [sheets, setSheets] = useState(DEFAULT_SHEETS);
  const [teamMembersSheet, setTeamMembersSheet] = useState(true);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState("");

  useEffect(() => {
    axios.get(`${URL}/admin/export/options`, { withCredentials: true })
      .then((res) => {
        setOptions(res.data);
        // every column is chosen to begin with
        setColumns(Object.fromEntries(Object.entries(res.data.columns).map(([k, cols]) => [k, cols.map((c) => c.key)])));
      })
      .catch(() => toast.error("Could not load the export options"));
  }, []);

  const f = filters[tab];
  const setF = (key) => (value) => setFilters((prev) => ({ ...prev, [tab]: { ...prev[tab], [key]: value } }));
  const resetFilters = () => setFilters((prev) => ({ ...prev, [tab]: EMPTY[tab] }));
  const filtersActive = JSON.stringify(f) !== JSON.stringify(EMPTY[tab]);

  // live count of matching rows (debounced)
  useEffect(() => {
    if (!options) return undefined;
    setPreview(null);
    const timer = setTimeout(() => {
      axios.post(`${URL}/admin/export/${tab}`, { filters: f, preview: true }, { withCredentials: true })
        .then((res) => setPreview(res.data))
        .catch(() => setPreview({ error: true }));
    }, 350);
    return () => clearTimeout(timer);
  }, [tab, f, options]);

  const allColumns = options?.columns?.[tab] || [];
  const groups = useMemo(() => {
    const map = new Map();
    for (const c of allColumns) map.set(c.group, [...(map.get(c.group) || []), c]);
    return [...map.entries()];
  }, [allColumns]);
  const chosen = columns[tab] || [];
  const setChosen = (next) => setColumns((prev) => ({ ...prev, [tab]: next }));
  const toggleColumn = (key) => setChosen(chosen.includes(key) ? chosen.filter((k) => k !== key) : allColumns.map((c) => c.key).filter((k) => k === key || chosen.includes(k)));
  const toggleGroup = (cols, on) => {
    const keys = cols.map((c) => c.key);
    setChosen(on ? allColumns.map((c) => c.key).filter((k) => chosen.includes(k) || keys.includes(k)) : chosen.filter((k) => !keys.includes(k)));
  };

  const run = async (kind) => {
    if (chosen.length === 0) {
      toast.error("Choose at least one column");
      return;
    }
    setBusy(kind);
    const loading = toast.loading(kind === "zip" ? "Building one report per problem statement…" : "Building the Excel file…");
    try {
      const url = kind === "zip" ? `${URL}/admin/export/problem-reports` : `${URL}/admin/export/${tab}`;
      const body = kind === "zip"
        ? { filters: f, columns: chosen, includeEmptyProblems: sheets.includeEmptyProblems }
        : { filters: f, columns: chosen, sheets: tab === "submissions" ? sheets : { members: teamMembersSheet } };
      const name = await downloadFile(url, body, kind === "zip" ? "problem_reports.zip" : `${tab}.xlsx`);
      toast.success(`Downloaded ${name}`, { id: loading });
    } catch (err) {
      toast.error(err.message, { id: loading });
    } finally {
      setBusy("");
    }
  };

  const problemOptions = (options?.problems || []).map((p) => [String(p.ID), `SFS_${p.ID} · ${p.TITLE}`]);
  const collegeOptions = (options?.colleges || []).map((c) => [c, c]);
  const countText = !preview ? "Counting…" : preview.error ? "Could not count" : tab === "submissions"
    ? `${preview.count} submission${preview.count === 1 ? "" : "s"} · ${preview.problems} problem statement${preview.problems === 1 ? "" : "s"} · ${preview.teams} team${preview.teams === 1 ? "" : "s"}`
    : `${preview.count} ${tab === "teams" ? "team" : "SPOC"}${preview.count === 1 ? "" : "s"}`;

  return (
    <div className="min-h-screen bg-[#F7F8FC] px-2 sm:px-6 py-8">
      <Toaster position="top-right" />
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#1A202C]">Exports</h1>
          <p className="text-[#718096] text-sm mt-1">Download Excel reports. Pick what to include with the filters and columns; the count updates as you go.</p>
        </div>

        {/* Type */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          {TABS.map(({ key, label, icon: Icon, hint }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`text-left rounded-2xl border p-4 transition ${tab === key ? "border-[#FF9900] bg-[#FFF7EC] ring-2 ring-orange-100" : "border-[#E2E8F0] bg-white hover:bg-gray-50"}`}
            >
              <div className="flex items-center gap-2 font-semibold text-[#1A202C]"><Icon className={tab === key ? "text-[#FF9900]" : "text-gray-400"} /> {label}</div>
              <p className="text-xs text-[#718096] mt-1">{hint}</p>
            </button>
          ))}
        </div>

        {!options ? (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-10 flex justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#FF9900]" />
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 space-y-6">
              {/* Filters */}
              <section className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-[#1A202C] flex items-center gap-2"><FiFilter className="text-[#FF9900]" /> Filters</h2>
                  {filtersActive && (
                    <button onClick={resetFilters} className="flex items-center gap-1.5 text-sm font-medium text-[#FF9900] hover:underline"><FiRotateCcw /> Clear filters</button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <label className="block sm:col-span-2 lg:col-span-3">
                    <span className={lbl}>Search</span>
                    <input value={f.search} onChange={(e) => setF("search")(e.target.value)} className={field}
                      placeholder={tab === "submissions" ? "Team, team lead email, solution title, problem or college…" : tab === "teams" ? "Team name, lead email, college or SPOC…" : "Name, email, college or college code…"} />
                  </label>

                  {tab === "submissions" && (<>
                    <MultiSelect label="Problem statements" options={problemOptions} value={f.problemIds} onChange={setF("problemIds")} placeholder="All problem statements" />
                    <MultiSelect label="Status" options={STATUSES} value={f.statuses} onChange={setF("statuses")} placeholder="Every status" />
                    <MultiSelect label="Colleges" options={collegeOptions} value={f.colleges} onChange={setF("colleges")} placeholder="All colleges" />
                    <MultiSelect label="Reviewed by" options={(options.reviewers || []).map((r) => [r, r])} value={f.reviewers} onChange={setF("reviewers")} placeholder="Anyone (or not reviewed)" />
                    <Select label="Teams" value={f.teamStatus} onChange={setF("teamStatus")} options={[["all", "Every team"], ["active", "Active teams only"], ["graduated", "Graduated teams only"], ["removed", "Teams removed by SPOC"]]} />
                    <div className="grid grid-cols-2 gap-2">
                      <label className="block"><span className={lbl}>Marks from</span><input type="number" min="0" max="100" value={f.marksMin} onChange={(e) => setF("marksMin")(e.target.value)} className={field} placeholder="0" /></label>
                      <label className="block"><span className={lbl}>Marks to</span><input type="number" min="0" max="100" value={f.marksMax} onChange={(e) => setF("marksMax")(e.target.value)} className={field} placeholder="100" /></label>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="block"><span className={lbl}>Submitted from</span><input type="date" value={f.submittedFrom} onChange={(e) => setF("submittedFrom")(e.target.value)} className={field} /></label>
                      <label className="block"><span className={lbl}>Submitted to</span><input type="date" value={f.submittedTo} onChange={(e) => setF("submittedTo")(e.target.value)} className={field} /></label>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="block"><span className={lbl}>Reviewed from</span><input type="date" value={f.reviewedFrom} onChange={(e) => setF("reviewedFrom")(e.target.value)} className={field} /></label>
                      <label className="block"><span className={lbl}>Reviewed to</span><input type="date" value={f.reviewedTo} onChange={(e) => setF("reviewedTo")(e.target.value)} className={field} /></label>
                    </div>
                  </>)}

                  {tab === "teams" && (<>
                    <MultiSelect label="Colleges" options={collegeOptions} value={f.colleges} onChange={setF("colleges")} placeholder="All colleges" />
                    <Select label="Team status" value={f.teamStatus} onChange={setF("teamStatus")} options={[["all", "Every team"], ["active", "Active only"], ["graduated", "Graduated only"], ["removed", "Removed by SPOC"]]} />
                    <Select label="Submissions" value={f.submissions} onChange={setF("submissions")} options={[["all", "All teams"], ["with", "Has submissions"], ["without", "No submissions"]]} />
                    <MultiSelect label="Assigned problem" options={problemOptions} value={f.problemIds} onChange={setF("problemIds")} placeholder="Any problem" />
                    {/* members graduate in different years, so the admin chooses how the year is matched */}
                    <div className="sm:col-span-2">
                      <span className={lbl}>Graduation year</span>
                      <div className="grid grid-cols-1 sm:grid-cols-[1fr_9rem] gap-2">
                        <select aria-label="How to match the graduation year" value={f.graduationMatch} onChange={(e) => setF("graduationMatch")(e.target.value)} className={field}>
                          <option value="upto">Every member graduates by (up to)</option>
                          <option value="exact">Team closes in (last member graduates)</option>
                          <option value="member">At least one member graduates in</option>
                        </select>
                        <select aria-label="Graduation year" value={f.graduationYear} onChange={(e) => setF("graduationYear")(e.target.value)} className={field}>
                          <option value="">Any year</option>
                          {(options.graduationYears || []).map((y) => <option key={y} value={String(y)}>{y}</option>)}
                        </select>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">A team's graduation year is its last member's year; the team closes after it.</p>
                    </div>
                  </>)}

                  {tab === "spocs" && (<>
                    <MultiSelect label="Account status" options={SPOC_STATUSES} value={f.spocStatuses} onChange={setF("spocStatuses")} placeholder="Every status" />
                    <MultiSelect label="Colleges" options={collegeOptions} value={f.colleges} onChange={setF("colleges")} placeholder="All colleges" />
                    <Select label="Teams" value={f.hasTeams} onChange={setF("hasTeams")} options={[["all", "All SPOCs"], ["with", "With teams"], ["without", "Without teams"]]} />
                  </>)}
                </div>
              </section>

              {/* Columns */}
              <section className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-5">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <h2 className="font-semibold text-[#1A202C] flex items-center gap-2"><FiColumns className="text-[#FF9900]" /> Columns <span className="text-sm font-normal text-[#718096]">({chosen.length} of {allColumns.length})</span></h2>
                  <div className="flex gap-3 text-sm font-medium">
                    <button onClick={() => setChosen(allColumns.map((c) => c.key))} className="text-[#FF9900] hover:underline">Select all</button>
                    <button onClick={() => setChosen([])} className="text-[#718096] hover:underline">Clear</button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {groups.map(([group, cols]) => {
                    const on = cols.filter((c) => chosen.includes(c.key)).length;
                    return (
                      <div key={group} className="border border-[#E2E8F0] rounded-xl p-3">
                        <label className="flex items-center gap-2 text-sm font-semibold text-[#1A202C] mb-2 cursor-pointer">
                          <input type="checkbox" className="accent-[#FF9900]" checked={on === cols.length} ref={(el) => { if (el) el.indeterminate = on > 0 && on < cols.length; }} onChange={(e) => toggleGroup(cols, e.target.checked)} />
                          {group} <span className="font-normal text-[#A0AEC0]">{on}/{cols.length}</span>
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1">
                          {cols.map((c) => (
                            <label key={c.key} className="flex items-center gap-2 text-sm text-[#4A5568] cursor-pointer">
                              <input type="checkbox" className="accent-[#FF9900]" checked={chosen.includes(c.key)} onChange={() => toggleColumn(c.key)} />
                              <span className="truncate" title={c.header}>{c.header}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>

            {/* Output */}
            <aside className="space-y-6">
              <section className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-5 xl:sticky xl:top-6">
                <div className="rounded-xl bg-[#FFF7EC] border border-orange-200 px-4 py-3 mb-5">
                  <div className="text-xs font-semibold uppercase tracking-wide text-[#C05621]">Matches</div>
                  <div className="text-lg font-bold text-[#1A202C]">{countText}</div>
                </div>

                {tab === "submissions" ? (<>
                  <h3 className="font-semibold text-[#1A202C] flex items-center gap-2 mb-2"><FiLayers className="text-[#FF9900]" /> One workbook</h3>
                  <div className="space-y-1.5 mb-4">
                    {[
                      ["summary", "Summary by problem statement"],
                      ["byProblem", "By problem statement (teams under each problem)"],
                      ["all", "All submissions (one table)"],
                      ["reviewHistory", "Review history (every decision and comment)"],
                      ["members", "Team members"],
                    ].map(([key, text]) => (
                      <label key={key} className="flex items-center gap-2 text-sm text-[#4A5568] cursor-pointer">
                        <input type="checkbox" className="accent-[#FF9900]" checked={sheets[key]} onChange={(e) => setSheets((prev) => ({ ...prev, [key]: e.target.checked }))} />
                        {text}
                      </label>
                    ))}
                  </div>
                  <button onClick={() => run("xlsx")} disabled={Boolean(busy) || preview?.count === 0}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#FF9900] text-white font-semibold hover:bg-[#e68900] disabled:opacity-50">
                    <FiDownload /> {busy === "xlsx" ? "Building…" : "Download Excel"}
                  </button>

                  <div className="border-t border-[#E2E8F0] my-5" />

                  <h3 className="font-semibold text-[#1A202C] flex items-center gap-2 mb-1"><FiArchive className="text-[#FF9900]" /> One report per problem</h3>
                  <p className="text-xs text-[#718096] mb-3">A ZIP with a separate Excel report for every problem statement (its details, counts, every team's submission and the review history) plus an overview file.</p>
                  <label className="flex items-center gap-2 text-sm text-[#4A5568] cursor-pointer mb-3">
                    <input type="checkbox" className="accent-[#FF9900]" checked={sheets.includeEmptyProblems} onChange={(e) => setSheets((prev) => ({ ...prev, includeEmptyProblems: e.target.checked }))} />
                    Include problem statements without submissions
                  </label>
                  <button onClick={() => run("zip")} disabled={Boolean(busy)}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#FF9900] text-[#FF9900] font-semibold hover:bg-[#FF9900] hover:text-white disabled:opacity-50 transition">
                    <FiArchive /> {busy === "zip" ? "Building…" : "Download reports (ZIP)"}
                  </button>
                </>) : (<>
                  {tab === "teams" && (
                    <label className="flex items-center gap-2 text-sm text-[#4A5568] cursor-pointer mb-4">
                      <input type="checkbox" className="accent-[#FF9900]" checked={teamMembersSheet} onChange={(e) => setTeamMembersSheet(e.target.checked)} />
                      Add a sheet with every team member
                    </label>
                  )}
                  <button onClick={() => run("xlsx")} disabled={Boolean(busy) || preview?.count === 0}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#FF9900] text-white font-semibold hover:bg-[#e68900] disabled:opacity-50">
                    <FiDownload /> {busy ? "Building…" : "Download Excel"}
                  </button>
                </>)}

                <ul className="mt-5 space-y-1.5 text-xs text-[#718096]">
                  {["Every file starts with an \"About this export\" sheet: date, who exported it and the filters used.", "Headers are frozen and every table has Excel filters.", "Leave a filter empty to include everything."].map((t) => (
                    <li key={t} className="flex gap-2"><FiCheck className="text-green-600 shrink-0 mt-0.5" /> {t}</li>
                  ))}
                </ul>
                {chosen.length === 0 && <p className="mt-3 text-sm text-red-600 flex items-center gap-1"><FiX /> Choose at least one column.</p>}
              </section>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
};

export default Exports;
