import { useEffect, useState } from "react";
import axios from "axios";
import { URL, resolveFileUrl } from "../../Utils";
import { HiOutlineDownload, HiOutlineEye, HiOutlineExternalLink, HiX } from 'react-icons/hi';

const statusColor = (s) => {
  const st = (s || "").toString().toUpperCase();
  if (st.includes("ACCE")) return "bg-green-400 text-white";
  if (st.includes("REJ")) return "bg-red-500 text-white";
  if (st.includes("PEND")) return "bg-yellow text-black";
  return "bg-gray-200 text-black";
};

// const mapSubmission = (row = {}) => ({
//   id: row.id ?? row.SUBMISSION_ID ?? row.SUB_ID ?? row.submissionId ?? row.SUBMISSION_ID,
//   problemId: row.PROBLEM_ID ?? row.problemId ?? "-",
//   teamId: row.TEAM_ID ?? row.teamId ?? "-",
//   title: row.SOL_TITLE ?? row.title ?? "Untitled Submission",
//   description: row.SOL_DESCRIPTION ?? row.description ?? "",
//   submittedAt: row.SUB_DATE ?? row.submittedAt ?? null,
//   status: row.STATUS ?? row.status ?? "PENDING",
//   pdfLink: row.SOL_LINK ?? row.pdfLink ?? "",
// });

function FriendlyDate({ value }) {
  if (!value) return <span className="text-text-tertiary">—</span>;
  const d = new Date(value + (value.length === 10 ? 'T00:00:00' : ''));
  return <time dateTime={d.toISOString()}>{d.toLocaleDateString()}</time>;
}

const mapSubmission = (row = {}) => ({
  ...row,
  ID: row.ID ?? row.id ?? row.submission_id,
  PROBLEM_ID: row.PROBLEM_ID ?? row.problemId ?? row.problem_id,
  STATUS: row.STATUS ?? row.status ?? row.SUB_STATUS ?? "PENDING",
  SUB_DATE: row.SUB_DATE ?? row.submittedAt ?? row.submitted_date,
  SOL_TITLE: row.SOL_TITLE ?? row.title ?? row.submission_title ?? "Untitled submission",
  SOL_DESCRIPTION: row.SOL_DESCRIPTION ?? row.description ?? "",
  FILES: row.FILES ?? row.solution_document ?? row.SOL_LINK ?? row.sol_link ?? row.pdfLink ?? row.pdfUrl ?? row.files?.find((file) => /\.pdf$/i.test(file)),
  teamId: row.teamId ?? row.TEAM_ID ?? row.team_id,
  title: row.title ?? row.SOL_TITLE ?? row.submission_title ?? "Untitled submission",
});

export default function Student_submitions({ submission: propSubmission }) {
  const [submission, setSubmission] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showViewer, setShowViewer] = useState(false);
  const [userEmail, setEmail] = useState('');

  useEffect(() => {
    if (propSubmission) {
      setSubmission(mapSubmission(propSubmission));
      return;
    }

    const fetch = async () => {
      try {
        setLoading(true);
        setError(null);
        axios.defaults.withCredentials = true;
        
        const res = await axios.post(`${URL}/get_submissions_by_email`, { userEmail }, { timeout: 5000 });
        const data = res.data;
        if (Array.isArray(data)) {
          const first = data[0] ?? null;
          setSubmission(first ? mapSubmission(first) : null);
        } else if (data) {
          setSubmission(mapSubmission(data));
        } else {
          setSubmission(null);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [propSubmission, userEmail]);

  const s = submission;
  const pdfSrc = resolveFileUrl(s?.FILES);
  
  // Close modal on ESC
  useEffect(() => {
    if (!showViewer) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setShowViewer(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showViewer]);

  useEffect(() => {
    axios.get(`${URL}/cookie`, { withCredentials: true })
      .then((res) => setEmail(res.data.EMAIL))
      .catch((err) => console.error("Failed to load current user", err));
  }, [])
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-b from-[rgba(255,153,0,0.03)] to-background-light">
        <div className="text-xl font-semibold text-text-secondary">Loading submission...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-b from-[rgba(255,153,0,0.03)] to-background-light">
        <div className="text-xl font-semibold text-red-500">{error}</div>
      </div>
    );
  }

  if (!s) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-b from-[rgba(255,153,0,0.03)] to-background-light">
        <div className="text-xl font-semibold text-text-secondary">No submission found.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-[rgba(255,153,0,0.03)] to-background-light px-4 py-12">
      <div className="w-full max-w-6xl mx-auto rounded-2xl overflow-hidden bg-white shadow-lg transition-shadow hover:shadow-2xl">
        <div className="flex flex-col md:flex-row">
          {/* left accent */}
          <div className="hidden md:block w-2 bg-linear-to-b from-[#FF9900] to-[#D46F00]" />
          <div className="flex-1 p-6 md:p-8">
            <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary">Submission Details</h1>
                <p className="text-sm text-text-secondary mt-1">Problem • <span className="font-medium">{submission.PROBLEM_ID}</span> — Team <span className="font-medium">{s.teamId}</span></p>
              </div>

              <div className="flex items-center gap-4">
                <div className={`inline-flex items-center gap-3 px-4 py-2 rounded-full ${statusColor(s.status)} font-semibold shadow-sm`}>
                  <span className="text-sm">{submission.STATUS?.toString().toUpperCase()}</span>
                </div>
                <div className="text-sm text-text-tertiary">Submitted: <FriendlyDate value={submission.SUB_DATE} /></div>
              </div>
            </header>

            <main className="mt-6 grid grid-cols-1 md:grid-cols-12 gap-6">
              <section className="md:col-span-7 space-y-4">
                <div className="rounded-lg overflow-hidden border border-border-color bg-white">
                  <div className="w-full h-80 md:h-130 bg-gray-50 relative">
                    {pdfSrc ? (
                        <>
                          <iframe src={pdfSrc} title="Submission preview" className="w-full h-full border-0" />
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-text-tertiary">No PDF attached for this submission.</span>
                        </div>
                      )}
                    </div>
                </div>

                <div className="mt-3 flex">
                  <h2 className="text-xl md:text-2xl font-semibold text-text-primary">{s.title}</h2>
                  <div className="text-sm text-text-secondary leading-relaxed mt-2">
                    {expanded ? submission.SOL_DESCRIPTION : (submission.SOL_DESCRIPTION?.slice(0, 420) + (submission.SOL_DESCRIPTION?.length > 420 ? '...' : ''))}
                  </div>
                  {submission.SOL_DESCRIPTION && submission.SOL_DESCRIPTION.length > 420 && (
                    <button onClick={() => setExpanded((v) => !v)} className="text-sm text-action-blue font-medium mt-2">
                      {expanded ? 'Show less' : 'Read more'}
                    </button>
                  )}

                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      onClick={() => setShowViewer(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-linear-to-r from-[#FF9900] to-[#D46F00] text-white font-semibold shadow-md hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-[#FF9900]/40"
                      aria-label="View full PDF"
                    >
                      <HiOutlineEye className="w-5 h-5" />
                      View Full
                    </button>

                    <a
                      href={pdfSrc}
                      download
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-border-color text-text-primary bg-white hover:bg-gray-50 shadow-sm"
                    >
                      <HiOutlineDownload className="w-5 h-5 text-text-primary" />
                      Download
                    </a>

                    <button
                      onClick={() => window.open(pdfSrc, '_blank', 'noopener,noreferrer')}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm text-text-secondary bg-gray-50 border border-border-color"
                    >
                      <HiOutlineExternalLink className="w-4 h-4" />
                      Open in new tab
                    </button>
                  </div>
                </div>
              </section>

              <aside className="md:col-span-5 bg-background-light rounded-xl p-6 border border-border-color shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm text-text-secondary mb-1">Submission</div>
                    <div className="text-lg font-semibold text-text-primary">#{submission.ID ?? '-'}</div>
                  </div>
                  <div className="text-right">
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${statusColor(submission.STATUS)} font-semibold text-sm`}>{submission.STATUS?.toString().toUpperCase()}</div>
                    <div className="text-xs text-text-tertiary mt-1">{new Date(submission.SUB_DATE || Date.now()).toLocaleString()}</div>
                  </div>
                </div>


                <div className="mt-5 border-t border-border-color pt-4">
                  <h3 className="text-sm text-text-secondary font-medium">Details</h3>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-text-secondary">
                    <div className="flex flex-col"><span className="text-xs">Problem ID</span><span className="font-medium text-text-primary">{submission.PROBLEM_ID}</span></div>
                    {/* <div className="flex flex-col"><span className="textTeam-xs">Team ID</span><span className="font-medium text-text-primary">{s.teamId}</span></div> */}
                    <div className="flex flex-col"><span className="text-xs">Submitted</span><span className="font-medium text-text-primary"><FriendlyDate value={submission.SUB_DATE} /></span></div>
                    <div className="flex flex-col"><span className="text-xs">Status</span><span className="font-medium text-text-primary">{submission.STATUS}</span></div>
                  </div>
                </div>

                <div className="mt-5 border-t border-border-color pt-4">
                  <h3 className="text-sm text-text-secondary font-medium">Actions</h3>
                  <div className="mt-3 flex flex-col gap-3">
                    <button onClick={() => setShowViewer(true)} className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-linear-to-r from-[#FF9900] to-[#D46F00] text-white font-semibold shadow-sm">
                      <HiOutlineEye className="w-5 h-5" /> View
                    </button>

                    <a href={pdfSrc} download className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md border border-border-color bg-white text-text-primary">
                      <HiOutlineDownload className="w-5 h-5" /> Download
                    </a>

                    

                    
                  </div>
                </div>
              </aside>
            </main>

            {loading && <div className="mt-6 text-sm text-text-secondary">Loading submission...</div>}
            {error && <div className="mt-6 text-sm text-red-500">{error}</div>}
          </div>
        </div>
      </div>

      {/* Modal viewer */}
      {showViewer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-6xl h-[92vh] bg-white rounded-lg overflow-hidden relative shadow-2xl">
            <div className="absolute top-3 right-3 z-20">
              <button
                onClick={() => setShowViewer(false)}
                aria-label="Close PDF viewer"
                className="p-2 rounded-md bg-white border shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#FF9900]/30"
              >
                <HiX className="w-5 h-5" />
              </button>
            </div>
            {pdfSrc ? (
              <iframe src={pdfSrc} title="PDF viewer" className="w-full h-full border-0" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-text-tertiary">No PDF to preview</div>
            )}
          </div>
        </div>
      )}
    </div>
    // <div>hey</div>
  );
}
