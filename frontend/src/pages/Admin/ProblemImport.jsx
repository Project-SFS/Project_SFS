import React, { useMemo, useRef, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import {
  FiArrowLeft, FiDownload, FiUploadCloud, FiFileText, FiX, FiCheckCircle,
  FiAlertTriangle, FiAlertCircle, FiCopy,
} from "react-icons/fi";
import { URL } from "../../Utils";
import Pagination, { usePagination } from "../../components/common/Pagination";

// Admin: add many problem statements at once from the Excel template.
// Step 1 checks the file (nothing is saved), step 2 imports the rows that passed.
const TEMPLATE_HEADERS = ["S.No", "Problem Title", "Problem Description", "Domain", "Expected Outcomes", "Requirements", "Technology"];

const STATUS = {
  ready: { label: "Ready", cls: "bg-green-100 text-green-800", icon: FiCheckCircle },
  duplicate: { label: "Duplicate, skipped", cls: "bg-gray-200 text-gray-700", icon: FiCopy },
  error: { label: "Error, skipped", cls: "bg-red-100 text-red-800", icon: FiAlertCircle },
};

const VIEWS = [
  ["all", "All rows"],
  ["importable", "Will be imported"],
  ["skipped", "Will be skipped"],
];

const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const ProblemImport = () => {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [deadline, setDeadline] = useState("");
  const [category, setCategory] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [checking, setChecking] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(null); // dry-run response
  const [result, setResult] = useState(null); // import response
  const [view, setView] = useState("all");
  const [expanded, setExpanded] = useState(null);

  const resetResults = () => {
    setPreview(null);
    setResult(null);
    setError("");
    setView("all");
  };

  const pickFile = (candidate) => {
    if (!candidate) return;
    if (!/\.xlsx$/i.test(candidate.name)) {
      setError("Choose an Excel .xlsx file. Older .xls files: open them in Excel and use File → Save As → Excel Workbook.");
      return;
    }
    if (candidate.size > 5 * 1024 * 1024) {
      setError("The file is larger than 5 MB.");
      return;
    }
    resetResults();
    setFile(candidate);
  };

  const send = (dryRun) => {
    const form = new FormData();
    form.append("file", file);
    form.append("deadline", deadline);
    form.append("category", category);
    form.append("dryRun", String(dryRun));
    return axios.post(`${URL}/admin/problems/import`, form, { withCredentials: true });
  };

  const canCheck = file && deadline && category && !checking && !importing;

  const checkFile = async (e) => {
    e.preventDefault();
    if (!canCheck) return;
    setChecking(true);
    setError("");
    setResult(null);
    try {
      const res = await send(true);
      setPreview(res.data);
      setView("all");
    } catch (err) {
      setPreview(null);
      setError(err.response?.data?.message || "The file could not be checked, please try again.");
    } finally {
      setChecking(false);
    }
  };

  const runImport = async () => {
    setImporting(true);
    setError("");
    try {
      const res = await send(false);
      setResult(res.data);
      setPreview(null);
    } catch (err) {
      setError(err.response?.data?.message || "The import failed, please try again.");
    } finally {
      setImporting(false);
    }
  };

  const rows = useMemo(() => {
    const all = preview?.rows || [];
    if (view === "importable") return all.filter((r) => r.status === "ready");
    if (view === "skipped") return all.filter((r) => r.status === "error" || r.status === "duplicate");
    return all;
  }, [preview, view]);
  const { page, setPage, pageItems, total, totalPages } = usePagination(rows, { resetKey: view });

  const summary = preview?.summary;
  const input = "w-full px-4 py-3 border border-[#E2E8F0] rounded-xl bg-white text-[#1A202C] focus:ring-2 focus:ring-[#FF9900]/30 focus:border-[#FF9900] outline-none";

  return (
    <div className="min-h-screen bg-[#F7F8FC] px-6 py-8">
      <div className="max-w-6xl mx-auto">
        <button onClick={() => navigate("/admin/problems")} className="inline-flex items-center gap-2 text-sm font-medium text-[#718096] hover:text-[#FF9900] mb-5">
          <FiArrowLeft /> Back to problem statements
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#1A202C] mb-1">Import Problem Statements</h1>
          <p className="text-[#718096] text-sm">Add many problem statements at once from the Excel template. Every file is checked first; nothing is saved until you confirm.</p>
        </div>

        {/* Result after importing */}
        {result && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 mb-8">
            <div className="flex gap-4">
              <FiCheckCircle className="text-3xl text-green-600 shrink-0" />
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-green-800">
                  {result.summary.imported} problem statement{result.summary.imported === 1 ? "" : "s"} imported
                </h2>
                <p className="text-sm text-green-700 mt-1">
                  They are live now, and every active SPOC has been emailed the list.
                  {result.summary.total - result.summary.imported > 0 && ` ${result.summary.total - result.summary.imported} row(s) were skipped (duplicates or errors).`}
                </p>
                <div className="flex flex-wrap gap-3 mt-4">
                  <Link to="/admin/problems" className="px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700">
                    View problem statements
                  </Link>
                  <button
                    onClick={() => { setResult(null); setFile(null); }}
                    className="px-4 py-2 rounded-xl border border-green-300 text-green-800 text-sm font-medium hover:bg-green-100"
                  >
                    Import another file
                  </button>
                </div>
                {result.created.length > 0 && (
                  <ul className="mt-4 text-sm text-green-900 space-y-1 max-h-48 overflow-y-auto">
                    {result.created.map((c) => (
                      <li key={c.id}>
                        <Link to={`/admin/problems/${c.id}/details`} className="hover:underline">SFS_{c.id} · {c.title}</Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Step 1: template */}
          <section className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-6">
            <div className="text-xs font-bold text-[#FF9900] mb-1">STEP 1</div>
            <h2 className="font-semibold text-[#1A202C] mb-2">Fill in the template</h2>
            <p className="text-sm text-[#718096] mb-4">One problem statement per row. Keep the header row exactly as it is.</p>
            <ol className="text-sm text-[#4A5568] space-y-1 mb-5 list-decimal list-inside">
              {TEMPLATE_HEADERS.map((h) => (
                <li key={h}>
                  {h}
                  {(h === "Problem Title" || h === "Problem Description") && <span className="text-red-500"> *</span>}
                </li>
              ))}
            </ol>
            <a
              href={`${URL}/admin/problems/import/template`}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#FF9900] text-[#FF9900] text-sm font-semibold hover:bg-[#FF9900] hover:text-white transition"
            >
              <FiDownload /> Download template
            </a>
            <p className="text-xs text-[#A0AEC0] mt-3">* required.</p>
          </section>

          {/* Step 2: file + settings */}
          <form onSubmit={checkFile} className="lg:col-span-2 bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-6 space-y-5">
            <div>
              <div className="text-xs font-bold text-[#FF9900] mb-1">STEP 2</div>
              <h2 className="font-semibold text-[#1A202C]">Upload the file and check it</h2>
            </div>

            {file ? (
              <div className="flex items-center gap-4 p-4 rounded-xl border border-green-200 bg-green-50">
                <div className="w-11 h-11 rounded-lg bg-white border border-green-200 flex items-center justify-center shrink-0">
                  <FiFileText className="text-xl text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-[#1A202C] truncate">{file.name}</div>
                  <div className="text-xs text-[#718096]">{Math.max(1, Math.round(file.size / 1024))} KB · Excel workbook</div>
                </div>
                <button type="button" onClick={() => inputRef.current?.click()} className="text-sm font-medium text-[#FF9900] hover:underline">Change</button>
                <button type="button" onClick={() => { setFile(null); resetResults(); }} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-white" aria-label="Remove file">
                  <FiX />
                </button>
              </div>
            ) : (
              <div
                onDrop={(e) => { e.preventDefault(); setDragActive(false); pickFile(e.dataTransfer.files?.[0]); }}
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onClick={() => inputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputRef.current?.click(); } }}
                className={`h-36 rounded-xl border-2 border-dashed flex flex-col items-center justify-center text-center px-6 cursor-pointer transition ${dragActive ? "border-[#FF9900] bg-orange-50" : "border-[#E2E8F0] hover:border-[#FF9900] hover:bg-orange-50/40"}`}
              >
                <FiUploadCloud className="text-3xl text-[#FF9900] mb-2" />
                <div className="text-sm text-[#4A5568]"><b>Click to choose</b> or drag the filled-in template here</div>
                <div className="text-xs text-[#A0AEC0] mt-1">Excel .xlsx, up to 5 MB and 500 rows</div>
              </div>
            )}
            <input ref={inputRef} type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="hidden" onChange={(e) => { pickFile(e.target.files?.[0]); e.target.value = null; }} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-sm font-semibold text-[#4A5568]">Submission deadline <span className="text-red-500">*</span></span>
                <input type="date" min={todayIso()} value={deadline} onChange={(e) => { setDeadline(e.target.value); setPreview(null); }} className={`${input} mt-1.5`} required />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-[#4A5568]">Category <span className="text-red-500">*</span></span>
                <select value={category} onChange={(e) => { setCategory(e.target.value); setPreview(null); }} className={`${input} mt-1.5`} required>
                  <option value="">Select category</option>
                  <option value="software">Software</option>
                  <option value="hardware">Hardware</option>
                </select>
              </label>
            </div>
            <p className="text-xs text-[#718096] -mt-2">The deadline and category apply to every problem statement in this file.</p>

            {error && (
              <div className="flex gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                <FiAlertTriangle className="shrink-0 mt-0.5" /> <span>{error}</span>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!canCheck}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#FF9900] text-white text-sm font-semibold shadow-sm hover:bg-[#e68900] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {checking ? "Checking file…" : "Check file"}
              </button>
            </div>
          </form>
        </div>

        {/* Step 3: preview */}
        {preview && (
          <section className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
              <div>
                <div className="text-xs font-bold text-[#FF9900] mb-1">STEP 3</div>
                <h2 className="font-semibold text-[#1A202C]">Review and import</h2>
                <p className="text-sm text-[#718096]">Sheet "{preview.sheet}" · {summary.total} rows found</p>
              </div>
              <button
                onClick={runImport}
                disabled={importing || summary.ready === 0}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-green-600 text-white text-sm font-semibold shadow-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiUploadCloud />
                {importing ? "Importing…" : summary.ready === 0 ? "Nothing to import" : `Import ${summary.ready} problem statement${summary.ready === 1 ? "" : "s"}`}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
              {[
                ["Will be imported", summary.ready, "text-green-700"],
                ["Duplicates (skipped)", summary.duplicates, "text-gray-600"],
                ["Errors (skipped)", summary.errors, "text-red-700"],
              ].map(([label, value, cls]) => (
                <div key={label} className="rounded-xl border border-[#E2E8F0] p-3">
                  <div className="text-xs text-[#718096]">{label}</div>
                  <div className={`text-2xl font-bold ${cls}`}>{value}</div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {VIEWS.map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setView(key)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border ${view === key ? "bg-[#FF9900] text-white border-[#FF9900]" : "bg-white text-[#4A5568] border-[#E2E8F0] hover:bg-gray-50"}`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="overflow-x-auto border border-[#E2E8F0] rounded-xl">
              <table className="min-w-full text-sm">
                <thead className="bg-[#F7F8FC] text-[#718096]">
                  <tr>
                    <th className="text-left py-3 px-3 font-semibold">Row</th>
                    <th className="text-left py-3 px-3 font-semibold">S.No</th>
                    <th className="text-left py-3 px-3 font-semibold">Problem title</th>
                    <th className="text-left py-3 px-3 font-semibold">Domain</th>
                    <th className="text-left py-3 px-3 font-semibold">Technology</th>
                    <th className="text-left py-3 px-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.length === 0 ? (
                    <tr><td colSpan="6" className="py-6 text-center text-[#A0AEC0] italic">No rows in this view.</td></tr>
                  ) : pageItems.map((r) => {
                    const st = STATUS[r.status];
                    const open = expanded === r.row;
                    return (
                      <React.Fragment key={r.row}>
                        <tr onClick={() => setExpanded(open ? null : r.row)} className="border-t border-[#E2E8F0] align-top hover:bg-orange-50/40 cursor-pointer">
                          <td className="py-3 px-3 text-[#718096]">{r.row}</td>
                          <td className="py-3 px-3 text-[#718096]">{r.sno || "—"}</td>
                          <td className="py-3 px-3 max-w-md">
                            <div className="font-medium text-[#1A202C] [overflow-wrap:anywhere]">{r.title || <span className="text-red-500">(no title)</span>}</div>
                            {r.description && <div className="text-xs text-[#718096] line-clamp-1 max-w-md">{r.description}</div>}
                          </td>
                          <td className="py-3 px-3 text-[#4A5568]">{r.domain || "—"}</td>
                          <td className="py-3 px-3 text-[#4A5568]">{r.technology || "—"}</td>
                          <td className="py-3 px-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${st.cls}`}>
                              <st.icon /> {st.label}
                            </span>
                            {r.messages.map((m) => <div key={m} className="text-xs text-[#718096] mt-1 max-w-xs">{m}</div>)}
                          </td>
                        </tr>
                        {open && (
                          <tr className="bg-[#F7F8FC]">
                            <td colSpan="6" className="px-6 py-4 max-w-0">
                              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                {[
                                  ["Problem Description", r.description],
                                  ["Expected Outcomes", r.outcomes],
                                  ["Requirements", r.requirements],
                                  ["Technology", r.technology],
                                ].map(([label, value]) => (
                                  <div key={label}>
                                    <dt className="font-semibold text-[#4A5568]">{label}</dt>
                                    <dd className="text-[#1A202C] whitespace-pre-line [overflow-wrap:anywhere]">{value || <span className="text-[#A0AEC0]">—</span>}</dd>
                                  </div>
                                ))}
                              </dl>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={totalPages} total={total} onChange={setPage} label="rows" />
            <p className="text-xs text-[#A0AEC0]">Click a row to see all its fields.</p>
          </section>
        )}
      </div>
    </div>
  );
};

export default ProblemImport;
