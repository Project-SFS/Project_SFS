import { useRef, useState } from "react";
import axios from "axios";
import { FiDownload, FiUploadCloud, FiFile, FiX, FiCheckCircle, FiAlertCircle, FiUsers } from "react-icons/fi";
import { URL } from "../Utils";
import Pagination, { usePagination } from "./common/Pagination";

// Bulk team creation from the Excel template (one row per person; rows with the same Team Name form a team).
// The file is checked first (nothing is saved); then the ready teams are created like the team form does.
//   spocs    - admins pass the approved SPOCs to choose from; SPOCs import for themselves (no prop)
//   onDone   - called after teams were created
const COLUMNS = ["Team Name", "Role", "Member Name", "Email", "Phone", "Gender", "Graduation Year", "Mentor Name", "Mentor Email"];
const REQUIRED = ["Team Name", "Role", "Member Name", "Email", "Phone", "Gender", "Graduation Year"];
const VIEWS = [["all", "All teams"], ["ready", "Will be created"], ["error", "Will be skipped"]];

const TeamImportPanel = ({ spocs = null, onDone }) => {
  const [file, setFile] = useState(null);
  const [spocId, setSpocId] = useState("");
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [view, setView] = useState("all");
  const [drag, setDrag] = useState(false);
  const inputRef = useRef(null);
  const needSpoc = Array.isArray(spocs);

  const downloadTemplate = async () => {
    setError("");
    try {
      const res = await axios.get(`${URL}/teams/import/template`, { withCredentials: true, responseType: "blob" });
      const href = window.URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = href;
      a.download = "teams-template.xlsx";
      a.click();
      setTimeout(() => window.URL.revokeObjectURL(href), 1000);
    } catch {
      setError("Could not download the template");
    }
  };

  const pick = (f) => {
    setPreview(null);
    setResult(null);
    setError("");
    if (!f) return;
    if (!/\.xlsx$/i.test(f.name)) { setError("Choose an Excel .xlsx file (the template)"); return; }
    if (f.size > 5 * 1024 * 1024) { setError("The file is larger than 5 MB"); return; }
    setFile(f);
  };

  const send = async (dryRun) => {
    setBusy(dryRun ? "check" : "import");
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("dryRun", String(dryRun));
      if (needSpoc) form.append("spocId", spocId);
      const res = await axios.post(`${URL}/teams/import`, form, { withCredentials: true });
      if (dryRun) { setPreview(res.data); setView("all"); }
      else { setResult(res.data); setPreview(null); onDone?.(res.data); }
    } catch (err) {
      setError(err.response?.data?.message || "The file could not be processed");
    } finally {
      setBusy("");
    }
  };

  const reset = () => { setFile(null); setPreview(null); setResult(null); setError(""); };
  const teams = (preview?.teams || []).filter((t) => view === "all" || t.status === view);
  const { page, setPage, pageItems, total, totalPages } = usePagination(teams, { resetKey: view });

  if (result) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-6">
        <div className="flex items-start gap-3">
          <FiCheckCircle className="text-3xl text-green-600 shrink-0" />
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-green-900">{result.summary.imported} team{result.summary.imported === 1 ? "" : "s"} created</h3>
            <p className="text-sm text-green-800 mt-1">
              Each team lead was emailed the team login and every member a welcome email.
              {result.summary.errors ? ` ${result.summary.errors} team${result.summary.errors === 1 ? " was" : "s were"} skipped because of problems in the file.` : ""}
              {result.failed?.length ? ` ${result.failed.length} could not be saved: ${result.failed.join(", ")}.` : ""}
            </p>
            {result.created?.length > 0 && (
              <ul className="mt-3 text-sm text-green-900 list-disc pl-5 space-y-0.5">
                {result.created.slice(0, 25).map((c) => <li key={c.id}>{c.name}</li>)}
                {result.created.length > 25 && <li>and {result.created.length - 25} more</li>}
              </ul>
            )}
            <button onClick={reset} className="mt-4 px-4 py-2 rounded-xl border border-green-300 text-green-800 text-sm font-medium hover:bg-green-100">Import another file</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid md:grid-cols-5 gap-5">
        {/* step 1 */}
        <div className="md:col-span-2 rounded-2xl border border-[#E2E8F0] bg-white p-5">
          <div className="text-xs font-semibold uppercase tracking-wide text-[#FF9900] mb-1">Step 1</div>
          <h3 className="font-semibold text-[#1A202C] mb-1">Fill in the template</h3>
          <p className="text-sm text-[#718096] mb-3">One row per person. Rows with the same Team Name form one team (2–5 people, one Team Lead).</p>
          <ol className="text-sm text-[#4A5568] space-y-1 list-decimal pl-5">
            {COLUMNS.map((c) => <li key={c}>{c}{REQUIRED.includes(c) && <span className="text-red-500"> *</span>}</li>)}
          </ol>
          <button onClick={downloadTemplate} className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#FF9900] text-[#FF9900] text-sm font-medium hover:bg-orange-50">
            <FiDownload /> Download template
          </button>
        </div>

        {/* step 2 */}
        <div className="md:col-span-3 rounded-2xl border border-[#E2E8F0] bg-white p-5 space-y-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-[#FF9900] mb-1">Step 2</div>
            <h3 className="font-semibold text-[#1A202C]">Upload the file and check it</h3>
          </div>
          {needSpoc && (
            <label className="block">
              <span className="text-sm font-semibold text-[#4A5568]">College (SPOC) the teams belong to <span className="text-red-500">*</span></span>
              <select value={spocId} onChange={(e) => { setSpocId(e.target.value); setPreview(null); }} className="mt-1.5 w-full px-3 py-2.5 border border-[#E2E8F0] rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9900]/30">
                <option value="">Choose a SPOC</option>
                {spocs.map((s) => <option key={s.ID} value={s.ID}>{s.COLLEGE || "No college"} · {s.NAME || s.EMAIL}</option>)}
              </select>
              {spocs.length === 0 && <span className="text-xs text-[#C05621]">There are no approved SPOCs yet. Create or approve a SPOC first.</span>}
            </label>
          )}
          {file ? (
            <div className="flex items-center gap-3 p-3 rounded-xl border border-green-200 bg-green-50">
              <FiFile className="text-xl text-green-700 shrink-0" />
              <div className="flex-1 min-w-0 text-sm font-medium text-[#1A202C] truncate">{file.name}</div>
              <button onClick={reset} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600" aria-label="Remove file"><FiX /></button>
            </div>
          ) : (
            <div
              role="button"
              tabIndex={0}
              onClick={() => inputRef.current?.click()}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputRef.current?.click(); } }}
              onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files?.[0]); }}
              className={`h-32 rounded-xl border-2 border-dashed flex flex-col items-center justify-center text-center px-6 cursor-pointer transition ${drag ? "border-[#FF9900] bg-orange-50" : "border-[#E2E8F0] hover:border-[#FF9900] hover:bg-orange-50/40"}`}
            >
              <FiUploadCloud className="text-3xl text-[#FF9900] mb-2" />
              <div className="text-sm text-[#4A5568]"><b>Click to choose</b> or drag the filled-in template here</div>
              <div className="text-xs text-[#A0AEC0] mt-1">Excel .xlsx, up to 5 MB and 1000 rows</div>
            </div>
          )}
          <input ref={inputRef} type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="hidden" onChange={(e) => { pick(e.target.files?.[0]); e.target.value = null; }} />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end">
            <button
              onClick={() => send(true)}
              disabled={!file || (needSpoc && !spocId) || Boolean(busy)}
              className="px-5 py-2.5 rounded-xl bg-[#FF9900] text-white text-sm font-semibold hover:bg-[#e68a00] disabled:opacity-50"
            >
              {busy === "check" ? "Checking…" : "Check file"}
            </button>
          </div>
        </div>
      </div>

      {/* step 3: preview */}
      {preview && (
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5">
          <div className="text-xs font-semibold uppercase tracking-wide text-[#FF9900] mb-1">Step 3</div>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h3 className="font-semibold text-[#1A202C]">
              {preview.summary.teams} teams · {preview.summary.people} people · <span className="text-green-700">{preview.summary.ready} ready</span>
              {preview.summary.errors > 0 && <> · <span className="text-red-600">{preview.summary.errors} with problems</span></>}
            </h3>
            <button
              onClick={() => send(false)}
              disabled={!preview.summary.ready || Boolean(busy)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-50"
            >
              <FiUsers /> {busy === "import" ? "Creating teams…" : `Create ${preview.summary.ready} team${preview.summary.ready === 1 ? "" : "s"}`}
            </button>
          </div>
          {preview.orphanRows?.length > 0 && (
            <p className="mb-3 text-sm text-[#C05621]">Rows without a Team Name were ignored: {preview.orphanRows.join(", ")}.</p>
          )}
          <div className="flex flex-wrap gap-2 mb-3">
            {VIEWS.map(([key, label]) => (
              <button key={key} onClick={() => setView(key)} className={`px-3 py-1.5 rounded-full text-sm border ${view === key ? "bg-[#FF9900] border-[#FF9900] text-white" : "border-[#E2E8F0] text-[#4A5568] hover:bg-[#F7F8FC]"}`}>{label}</button>
            ))}
          </div>
          <div className="divide-y divide-[#E2E8F0] border border-[#E2E8F0] rounded-xl">
            {pageItems.length === 0 ? (
              <p className="p-6 text-center text-sm text-[#A0AEC0] italic">No teams in this view.</p>
            ) : pageItems.map((t) => (
              <div key={t.name} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-semibold text-[#1A202C]">{t.name}</div>
                    <div className="text-xs text-[#718096]">Rows {t.rows.join(", ")}{t.mentorName ? ` · Mentor: ${t.mentorName}` : ""}</div>
                  </div>
                  {t.status === "ready"
                    ? <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800"><FiCheckCircle /> Ready</span>
                    : <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800"><FiAlertCircle /> Will be skipped</span>}
                </div>
                <ul className="mt-2 text-sm text-[#4A5568] space-y-0.5">
                  {t.members.map((m, i) => (
                    <li key={`${m.email}-${i}`} className="break-all"><span className="text-xs font-medium text-[#718096] mr-1">{m.role}:</span>{m.name || "—"} · {m.email || "no email"}</li>
                  ))}
                </ul>
                {t.messages.length > 0 && (
                  <ul className="mt-2 text-xs text-red-700 bg-red-50 rounded-lg px-3 py-2 space-y-0.5 list-disc pl-6">
                    {t.messages.map((m) => <li key={m}>{m}</li>)}
                  </ul>
                )}
              </div>
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} total={total} onChange={setPage} label="teams" />
        </div>
      )}
    </div>
  );
};

export default TeamImportPanel;
