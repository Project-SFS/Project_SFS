import { useEffect, useState } from "react";
import axios from "axios";
import { URL } from "../../Utils";
import { HiOutlineEye, HiOutlineExternalLink } from "react-icons/hi";
import SubmissionStatus from "./SubmissionStatus";
import DeleteSubmissionButton from "../../components/DeleteSubmissionButton";
import Pagination, { usePagination } from "../../components/common/Pagination";
import { Link } from "react-router-dom";
import { normalizeStatus, statusMeta, MarksBreakdown } from "../../submissionStatus";

const formatDate = (value) => (value ? String(value).split("T")[0] : "—");


// Every solution the team submitted (newest first), with its review status and the evaluator's comment
export default function Student_submitions() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // the backend answers with the logged-in team's own submissions
    axios
      .post(`${URL}/get_submissions_by_email`, {})
      .then((res) => setSubmissions(Array.isArray(res.data) ? res.data : []))
      .catch(() => setError("Could not load your submissions. Please refresh the page."))
      .finally(() => setLoading(false));
  }, []);

  const { page, setPage, pageItems, total, totalPages } = usePagination(submissions);

  if (loading) {
    return <div className="text-center text-gray-500 py-8">Loading submissions...</div>;
  }
  if (error) {
    return <div className="text-center text-red-600 py-8">{error}</div>;
  }
  if (submissions.length === 0) {
    return (
      <div className="text-center text-gray-600 py-8">
        You have not submitted any solutions yet. Request a problem statement under "Problem Statements" and submit once your SPOC approves it.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {pageItems.map((s) => {
        const status = normalizeStatus(s.STATUS);
        const pdfUrl = s.FILES ? `${URL}/${s.FILES}` : null;
        return (
          <div key={s.ID} className="border border-gray-200 rounded-lg p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-[#fc9300]">SFS_{s.PROBLEM_ID}</span>
                <h3 className="text-base font-semibold text-gray-900">{s.PROBLEM_TITLE || "Problem statement"}</h3>
                <p className="text-sm text-gray-600">
                  {s.SOL_TITLE || "Untitled solution"} · submitted {formatDate(s.SUB_DATE)}
                </p>
              </div>
              <div className="text-right">
                <SubmissionStatus submission={s} />
              </div>
            </div>

            {s.SOL_DESCRIPTION && <p className="mt-3 text-sm text-gray-700 whitespace-pre-line">{s.SOL_DESCRIPTION}</p>}

            {status !== "PENDING" && (
              <div className={`mt-4 rounded-md border-l-4 ${statusMeta(status).border} bg-gray-50 px-4 py-3`}>
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Evaluator's comment</div>
                <p className="text-sm text-gray-800 whitespace-pre-line">{s.EVALUATION_COMMENT || "No comment was added."}</p>
              </div>
            )}
            {status !== "PENDING" && <MarksBreakdown row={s} className="mt-3" />}

            <div className="mt-4 flex flex-wrap gap-2">
              {status === "CHANGES_REQUESTED" && (
                <Link
                  to={`/student/submit-solution?problemId=${s.PROBLEM_ID}`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700"
                >
                  Upload revised solution
                </Link>
              )}
              {status === "PENDING" && (
                <DeleteSubmissionButton
                  submissionId={s.ID}
                  label="Withdraw"
                  className="!py-1.5 !rounded-md"
                  confirmText="Withdraw this submission? You can submit again before the deadline."
                  onDeleted={() => setSubmissions((prev) => prev.filter((x) => x.ID !== s.ID))}
                />
              )}
              {pdfUrl && (
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium text-white bg-[#fc9300] hover:bg-[#e08300]"
                >
                  <HiOutlineEye /> View PDF
                </a>
              )}
              {s.SOL_LINK && (
                <a
                  href={s.SOL_LINK}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium text-gray-700 border border-gray-300 hover:bg-gray-50"
                >
                  <HiOutlineExternalLink /> Solution link
                </a>
              )}
            </div>
          </div>
        );
      })}
      <Pagination page={page} totalPages={totalPages} total={total} onChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }} label="submissions" />
    </div>
  );
}
