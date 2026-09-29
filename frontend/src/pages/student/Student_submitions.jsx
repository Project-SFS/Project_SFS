import { useEffect, useState } from "react";
import axios from "axios";
import { URL } from "../../Utils";
import { HiOutlineEye, HiOutlineExternalLink } from "react-icons/hi";
import SubmissionStatus from "./SubmissionStatus";
import DeleteSubmissionButton from "../../components/DeleteSubmissionButton";

const formatDate = (value) => (value ? String(value).split("T")[0] : "—");

const CRITERIA = [
  ["CP_MARK", "Client problem understanding & context", 20],
  ["PS_MARK", "Proposed solution strategy", 40],
  ["BV_MARK", "Business value & impact", 20],
  ["FP_MARK", "Feasibility & practical implementation", 10],
  ["IN_MARK", "Innovation", 10],
];

// Every solution the team submitted (newest first), with status and the evaluator's marks
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
      {submissions.map((s) => {
        const evaluated = s.STATUS && s.STATUS !== "PENDING";
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
                {evaluated && (
                  <div className="mt-2 text-2xl font-bold text-gray-900">
                    {s.MARK ?? 0}<span className="text-sm font-medium text-gray-500"> / 100</span>
                  </div>
                )}
              </div>
            </div>

            {s.SOL_DESCRIPTION && <p className="mt-3 text-sm text-gray-700 whitespace-pre-line">{s.SOL_DESCRIPTION}</p>}

            {evaluated && (
              <table className="mt-4 w-full text-sm border border-gray-200 rounded">
                <tbody>
                  {CRITERIA.map(([key, label, max]) => (
                    <tr key={key} className="border-t border-gray-100 first:border-t-0">
                      <td className="px-3 py-2 text-gray-600">{label}</td>
                      <td className="px-3 py-2 text-right font-medium text-gray-900">
                        {s[key] ?? 0} / {max}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              {s.STATUS === "PENDING" && (
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
    </div>
  );
}
