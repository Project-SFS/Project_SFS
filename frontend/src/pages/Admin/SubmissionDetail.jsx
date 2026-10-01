import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FiArrowLeft, FiEdit3, FiCheckCircle, FiXCircle, FiSend, FiClock } from 'react-icons/fi';
import axios from 'axios';
import { URL } from '../../Utils';
import Button from '../../components/common/button';
import Breadcrumb from '../../components/common/Breadcrumb';
import DeleteSubmissionButton from '../../components/DeleteSubmissionButton';
import { useAdmin, PERMISSION_LABELS } from '../../components/admin/adminAccess';
import { StatusBadge, normalizeStatus, statusMeta, EVAL_CRITERIA, EVAL_TOTAL_MAX, MarksBreakdown } from '../../submissionStatus';

// The three review decisions. Every decision and its comment are emailed to the team lead and,
// separately, to their SPOC. Marks are given (and emailed) only with an approval.
const DECISIONS = [
  {
    value: 'CHANGES_REQUESTED', label: 'Changes needed', result: 'Changes needed', icon: FiEdit3,
    hint: 'The team updates its solution and uploads it again.',
    active: 'border-orange-400 bg-orange-50 ring-2 ring-orange-200', iconCls: 'text-orange-600',
    button: 'bg-orange-500 hover:bg-orange-600', commentRequired: true,
    placeholder: 'Tell the team exactly what to change or add...',
  },
  {
    value: 'APPROVED', label: 'Approve', result: 'Approved', icon: FiCheckCircle,
    hint: 'The solution is accepted. It can no longer be changed by the team.',
    active: 'border-green-400 bg-green-50 ring-2 ring-green-200', iconCls: 'text-green-600',
    button: 'bg-green-600 hover:bg-green-700', commentRequired: false,
    placeholder: 'Optional: a note for the team, e.g. what was strong about the solution...',
  },
  {
    value: 'REJECTED', label: 'Reject', result: 'Rejected', icon: FiXCircle,
    hint: 'The solution is not accepted. It can no longer be changed by the team.',
    active: 'border-red-400 bg-red-50 ring-2 ring-red-200', iconCls: 'text-red-600',
    button: 'bg-red-600 hover:bg-red-700', commentRequired: true,
    placeholder: 'Explain why the solution is rejected...',
  },
];
const COMMENT_MAX = 5000;

// Loads the (login-protected) PDF itself so a missing or inaccessible file gets a clear message
// instead of the browser's generic "cannot embed" fallback
const PDFViewer = ({ url }) => {
  const [state, setState] = useState({ status: url ? 'loading' : 'none', blobUrl: null, message: '' });

  useEffect(() => {
    if (!url) {
      setState({ status: 'none', blobUrl: null, message: '' });
      return undefined;
    }
    let objectUrl = null;
    let cancelled = false;
    setState({ status: 'loading', blobUrl: null, message: '' });
    fetch(url, { credentials: 'include' })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(res.status === 404
            ? 'The solution file could not be found on the server. Ask the team to upload it again.'
            : res.status === 401 ? 'Your session has expired. Please log in again.'
            : 'You do not have access to this file.');
        }
        const blob = await res.blob();
        objectUrl = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
        if (!cancelled) setState({ status: 'ready', blobUrl: objectUrl, message: '' });
      })
      .catch((err) => {
        if (!cancelled) setState({ status: 'error', blobUrl: null, message: err.message || 'Could not load the PDF.' });
      });
    return () => {
      cancelled = true;
      if (objectUrl) window.URL.revokeObjectURL(objectUrl);
    };
  }, [url]);

  const ready = state.status === 'ready';

  return (
    <div className="w-full bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
      <div className="flex justify-between items-center bg-[#F7F8FC] px-4 py-3 border-b border-[#E2E8F0]">
        <span className="text-[#1A202C] font-medium">Document Preview</span>
        {ready && (
          <div className="space-x-3">
            <a
              href={state.blobUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 text-sm font-medium text-[#FF9900] border border-[#FF9900] rounded-xl hover:bg-[#FF9900] hover:text-white transition-colors"
            >
              View Fullscreen
            </a>
            <a
              href={state.blobUrl}
              download="solution.pdf"
              className="px-4 py-2 text-sm font-medium text-white bg-[#FF9900] rounded-xl hover:bg-[#e68900] transition-colors"
            >
              Download
            </a>
          </div>
        )}
      </div>

      <div className="w-full bg-gray-100 h-72 md:h-[60vh] lg:h-[80vh]">
        {ready ? (
          <iframe src={state.blobUrl} title="Solution document" className="w-full h-full border-0" />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 px-6 text-center">
            {state.status === 'loading' && <p>Loading document...</p>}
            {state.status === 'none' && <p>This submission has no PDF document.</p>}
            {state.status === 'error' && <p className="text-red-600">{state.message}</p>}
          </div>
        )}
      </div>
    </div>
  );
};

const InfoRow = ({ label, children }) => (
  <tr className="border-b border-[#E2E8F0]">
    <td className="p-4 font-medium bg-[#FF9900]/5 w-1/3 text-[#1A202C]">{label}</td>
    <td className="p-4 text-[#1A202C] break-words">{children || 'N/A'}</td>
  </tr>
);

const formatDateTime = (date) =>
  date ? new Date(date).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : null;

const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A';

const SubmissionDetail = () => {
  const { can } = useAdmin();
  const canEvaluate = can('EVALUATE');
  const { id } = useParams();
  const navigate = useNavigate();

  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [decision, setDecision] = useState('');
  const [comment, setComment] = useState('');
  // evaluation marks, criterion key -> text in the input ('' = not given)
  const emptyMarks = Object.fromEntries(EVAL_CRITERIA.map((c) => [c.key, '']));
  const [marks, setMarks] = useState(emptyMarks);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text }

  const load = () =>
    axios.get(`${URL}/submissions/${id}`, { withCredentials: true })
      .then((res) => {
        setSubmission(res.data);
        // re-reviewing starts from the current marks
        setMarks(res.data.EVAL_TOTAL != null
          ? Object.fromEntries(EVAL_CRITERIA.map((c) => [c.key, String(res.data[c.column] ?? '')]))
          : Object.fromEntries(EVAL_CRITERIA.map((c) => [c.key, ''])));
      })
      .catch((err) => setError(err.response?.status === 404 ? 'Submission not found.' : 'Failed to load submission details.'))
      .finally(() => setLoading(false));

  useEffect(() => {
    setLoading(true);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const chosen = DECISIONS.find((d) => d.value === decision);
  const commentMissing = chosen?.commentRequired && !comment.trim();
  const filledMarks = EVAL_CRITERIA.filter((c) => marks[c.key] !== '');
  const marksValid = EVAL_CRITERIA.every((c) => marks[c.key] === '' || (Number.isInteger(Number(marks[c.key])) && Number(marks[c.key]) >= 0 && Number(marks[c.key]) <= c.max));
  const allMarks = filledMarks.length === EVAL_CRITERIA.length;
  const marksTotal = EVAL_CRITERIA.reduce((sum, c) => sum + (Number(marks[c.key]) || 0), 0);
  // marks only belong to an approval: shown, required and sent only when "Approve" is chosen
  const isApproval = chosen?.value === 'APPROVED';
  const marksProblem = !isApproval ? ''
    : !marksValid ? 'Each mark must be a whole number from 0 to 20.'
    : !allMarks ? `Give marks for all five criteria to approve (${filledMarks.length}/${EVAL_CRITERIA.length} filled).`
    : '';

  const sendReview = async () => {
    if (!chosen || commentMissing || marksProblem || saving) return;
    setSaving(true);
    setMessage(null);
    try {
      await axios.post(`${URL}/review_submission`, {
        subid: submission.submission_id || id,
        decision,
        comment: comment.trim(),
        marks: isApproval && allMarks ? Object.fromEntries(EVAL_CRITERIA.map((c) => [c.key, Number(marks[c.key])])) : undefined,
      }, { withCredentials: true });
      setMessage({ type: 'success', text: `Saved as "${chosen.result}" and emailed to the team and their SPOC.` });
      setDecision('');
      setComment('');
      await load();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Could not save the review, please try again' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F8FC] flex justify-center items-center">
        <div className="text-xl text-gray-600">Loading submission details...</div>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="min-h-screen bg-[#F7F8FC] py-10">
        <div className="max-w-4xl mx-auto bg-white shadow rounded-2xl p-8">
          <h1 className="text-lg text-[#1A202C]">{error || 'Submission not found'}</h1>
          <Button onClick={() => navigate(-1)} className="mt-4 bg-[#FF9900] text-white px-4 py-2 rounded-xl">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const status = normalizeStatus(submission.status);
  const reviews = submission.reviews || [];

  return (
    <div className="min-h-screen bg-[#F7F8FC] py-10 px-4 sm:px-8 transition-all duration-300">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <Breadcrumb problemId={submission.problem_id} />
          <div className="flex items-center gap-3">
            {canEvaluate && (
            <DeleteSubmissionButton
              submissionId={submission.submission_id || id}
              className="rounded-xl"
              onDeleted={() => navigate(-1)}
            />
            )}
            <Button
              onClick={() => navigate(-1)}
              className="!bg-[#FF9900] !hover:bg-[#e68900] text-white px-4 py-2 rounded-xl flex items-center space-x-2 font-medium shadow-sm hover:shadow-md transition-all duration-200"
            >
              <FiArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </Button>
          </div>
        </div>

        {/* Submission information */}
        <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 border border-[#E2E8F0]">
          <h2 className="text-xl font-semibold mb-4 text-[#1A202C]">Submission</h2>
          <table className="w-full text-left border-collapse border border-[#E2E8F0] rounded-xl overflow-hidden">
            <tbody>
              <InfoRow label="Submission ID">{submission.submission_id}</InfoRow>
              <InfoRow label="Problem Title">{submission.problem_title}</InfoRow>
              <InfoRow label="Submission Title">{submission.submission_title}</InfoRow>
              <InfoRow label="Description"><span className="whitespace-pre-line">{submission.description}</span></InfoRow>
              <InfoRow label="Team Name">
                {submission.team_name}
                {submission.team_id && (
                  <Link
                    to={`/admin/users?section=teams&team=${submission.team_id}`}
                    className="ml-3 inline-flex items-center gap-1 text-sm font-medium text-[#FF9900] hover:underline"
                  >
                    View team details →
                  </Link>
                )}
              </InfoRow>
              <InfoRow label="College">{submission.college_name}</InfoRow>
              <InfoRow label="Submitted Date">{formatDate(submission.submitted_date)}</InfoRow>
              {submission.sol_link && (
                <InfoRow label="Solution Link">
                  <a href={submission.sol_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">{submission.sol_link}</a>
                </InfoRow>
              )}
              <InfoRow label="Status"><StatusBadge status={status} /></InfoRow>
              {status !== 'PENDING' && (
                <InfoRow label="Reviewed By">
                  {submission.evaluated_by_email || submission.evaluated_by_name ? (
                    <>
                      <span className="font-medium break-all">{submission.evaluated_by_email || submission.evaluated_by_name}</span>
                      {submission.evaluated_at && (
                        <span className="block text-sm text-[#718096]">on {formatDateTime(submission.evaluated_at)}</span>
                      )}
                    </>
                  ) : (
                    <span className="text-[#A0AEC0]">{submission.evaluated_at ? 'Deleted user' : 'Not recorded'}</span>
                  )}
                </InfoRow>
              )}
              {submission.EVAL_TOTAL != null && (
                <InfoRow label="Marks"><span className="font-semibold">{submission.EVAL_TOTAL} / {EVAL_TOTAL_MAX}</span></InfoRow>
              )}
              {submission.evaluation_comment && (
                <InfoRow label="Latest Comment"><span className="whitespace-pre-line">{submission.evaluation_comment}</span></InfoRow>
              )}
            </tbody>
          </table>
        </div>

        {/* Solution document */}
        <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 border border-[#E2E8F0]">
          <h2 className="text-xl font-semibold mb-4 text-[#1A202C]">Solution Document</h2>
          <PDFViewer url={submission.solution_document ? `${URL}/${submission.solution_document}` : null} />
        </div>

        {/* Review (needs the Evaluate submissions permission) */}
        {!canEvaluate ? (
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-[#E2E8F0] text-sm text-[#718096]">
            Reviewing needs the <b className="text-[#1A202C]">{PERMISSION_LABELS.EVALUATE}</b> permission. You can see the submission and its review history; ask the main admin if you should evaluate.
          </div>
        ) : (<>
        <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 border border-[#E2E8F0]">
          <h2 className="text-xl font-semibold mb-1 text-[#1A202C]">Review</h2>
          <p className="text-sm text-[#718096] mb-6">
            {status === 'PENDING'
              ? 'Choose a decision and write your comment. The team and their SPOC are emailed straight away.'
              : 'This submission has already been reviewed. A new decision replaces the current one and is emailed again.'}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6" role="radiogroup" aria-label="Decision">
            {DECISIONS.map((d) => {
              const Icon = d.icon;
              const selected = decision === d.value;
              return (
                <button
                  key={d.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setDecision(d.value)}
                  className={`text-left rounded-xl border p-4 transition-all ${selected ? d.active : 'border-[#E2E8F0] hover:border-gray-300 hover:bg-gray-50'}`}
                >
                  <div className="flex items-center gap-2 font-semibold text-[#1A202C]">
                    <Icon className={`text-xl ${d.iconCls}`} /> {d.label}
                  </div>
                  <p className="text-xs text-[#718096] mt-1.5">{d.hint}</p>
                </button>
              );
            })}
          </div>

          {isApproval && (
          <div className="mb-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
              <span className="text-sm font-semibold text-[#4A5568]">
                Evaluation marks <span className="text-red-500">*</span>
              </span>
              <span className="text-sm font-semibold text-[#1A202C]">Total: <span className="text-[#FF9900]">{marksTotal} / {EVAL_TOTAL_MAX}</span></span>
            </div>
            <div className="border border-[#E2E8F0] rounded-xl divide-y divide-[#E2E8F0]">
              {EVAL_CRITERIA.map((c, i) => (
                <div key={c.key} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[#1A202C]">{i + 1}. {c.label}</div>
                    <div className="text-xs text-[#718096]">{c.hint}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <input
                      type="number"
                      min="0"
                      max={c.max}
                      step="1"
                      inputMode="numeric"
                      aria-label={c.label}
                      value={marks[c.key]}
                      // whole numbers only, never above the criterion's maximum (typing 123 keeps 20)
                      onKeyDown={(e) => { if (["e", "E", "+", "-", ".", ","].includes(e.key)) e.preventDefault(); }}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, "").slice(0, 3);
                        const value = digits === "" ? "" : String(Math.min(c.max, Number(digits)));
                        setMarks((prev) => ({ ...prev, [c.key]: value }));
                      }}
                      onPaste={(e) => {
                        e.preventDefault();
                        const digits = (e.clipboardData.getData("text") || "").replace(/\D/g, "").slice(0, 3);
                        setMarks((prev) => ({ ...prev, [c.key]: digits === "" ? "" : String(Math.min(c.max, Number(digits))) }));
                      }}
                      className="w-20 border border-[#E2E8F0] rounded-xl px-3 py-2 text-center focus:ring-2 focus:ring-[#FF9900]/30 focus:border-[#FF9900] outline-none"
                    />
                    <span className="text-sm text-[#718096]">/ {c.max}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          )}
          {chosen && !isApproval && (
            <p className="mb-6 text-sm text-[#718096] bg-[#F7F8FC] border border-[#E2E8F0] rounded-xl px-4 py-3">
              No marks for this decision. Marks are given only when a solution is approved, and they are not included in this email.
            </p>
          )}

          <div className="flex justify-between mb-1.5">
            <label htmlFor="review-comment" className="text-sm font-semibold text-[#4A5568]">
              Comment for the team {chosen?.commentRequired ? <span className="text-red-500">*</span> : <span className="font-normal text-[#A0AEC0]">(optional)</span>}
            </label>
            <span className="text-xs text-[#A0AEC0]">{comment.length}/{COMMENT_MAX}</span>
          </div>
          <textarea
            id="review-comment"
            value={comment}
            maxLength={COMMENT_MAX}
            onChange={(e) => setComment(e.target.value)}
            rows={6}
            placeholder={chosen?.placeholder || 'Choose a decision above, then write your comment...'}
            className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-[#1A202C] focus:ring-2 focus:ring-[#FF9900]/30 focus:border-[#FF9900] outline-none resize-y"
          />

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4">
            <p className="text-sm text-[#718096]">
              {!chosen ? 'Choose Changes needed, Approve or Reject.'
                : marksProblem ? <span className="text-red-600">{marksProblem}</span>
                : commentMissing ? 'A comment is required for this decision.'
                : `The team lead and their SPOC will receive: ${chosen.result}${isApproval && allMarks ? ` with ${marksTotal}/${EVAL_TOTAL_MAX} marks` : ''}${comment.trim() ? ' and your comment' : ''}.`}
            </p>
            <button
              onClick={sendReview}
              disabled={!chosen || commentMissing || Boolean(marksProblem) || saving}
              className={`inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-white font-medium transition disabled:opacity-50 disabled:cursor-not-allowed ${chosen ? chosen.button : 'bg-gray-400'}`}
            >
              <FiSend /> {saving ? 'Sending…' : 'Send to team'}
            </button>
          </div>

          {message && (
            <p className={`mt-4 font-medium ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>{message.text}</p>
          )}
        </div>

        </>)}

        {/* Review history */}
        <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 border border-[#E2E8F0]">
          <h2 className="text-xl font-semibold mb-4 text-[#1A202C]">Review History</h2>
          {reviews.length === 0 ? (
            <p className="text-sm text-[#A0AEC0]">No reviews yet.</p>
          ) : (
            <ol className="relative border-l-2 border-[#E2E8F0] ml-2 space-y-6">
              {reviews.map((r) => {
                const meta = statusMeta(r.DECISION);
                return (
                  <li key={r.ID} className="ml-5">
                    <span className={`absolute -left-[9px] mt-1.5 w-4 h-4 rounded-full border-2 bg-white ${meta.border}`} />
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={r.DECISION} />
                      <span className="text-sm text-[#4A5568] break-all">{r.REVIEWER_EMAIL || r.REVIEWER_NAME || 'Deleted user'}</span>
                      <span className="text-xs text-[#A0AEC0] flex items-center gap-1"><FiClock /> {formatDateTime(r.REVIEWED_AT)}</span>
                      {r.EVAL_TOTAL != null && <span className="text-xs font-semibold text-[#1A202C]">{r.EVAL_TOTAL} / {EVAL_TOTAL_MAX}</span>}
                    </div>
                    {r.EVAL_TOTAL != null && <MarksBreakdown row={r} className="mt-2 max-w-xl" />}
                    {r.COMMENT ? (
                      <p className="mt-2 text-sm text-[#1A202C] whitespace-pre-line bg-[#F7F8FC] rounded-xl px-4 py-3">{r.COMMENT}</p>
                    ) : (
                      <p className="mt-1 text-sm text-[#A0AEC0]">No comment</p>
                    )}
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubmissionDetail;
