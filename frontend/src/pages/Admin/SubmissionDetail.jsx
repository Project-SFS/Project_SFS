import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import axios from 'axios';
import { URL } from '../../Utils';
import Button from '../../components/common/button';
import Breadcrumb from '../../components/common/Breadcrumb';
import DeleteSubmissionButton from '../../components/DeleteSubmissionButton';

// Scoring rubric; the order matches the marks the backend stores (CP, PS, BV, FP, IN)
const CRITERIA = [
  { key: 'cp_mark', title: 'Client Problem Understanding & Context', max: 20 },
  { key: 'ps_mark', title: 'Proposed Solution Strategy', max: 40 },
  { key: 'bv_mark', title: 'Business Value & Impact', max: 20 },
  { key: 'fp_mark', title: 'Feasibility & Practical Implementation', max: 10 },
  { key: 'in_mark', title: 'Innovation', max: 10 },
];
const PASS_MARK = 60;

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

const statusStyle = (status) =>
  status === 'ACCEPTED' ? 'bg-green-100 text-green-800'
    : status === 'REJECTED' ? 'bg-red-100 text-red-800'
    : 'bg-yellow-100 text-yellow-800';

const SubmissionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scores, setScores] = useState(CRITERIA.map(() => 0));
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null); // { type: 'success' | 'error', text }

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    axios.get(`${URL}/submissions/${id}`, { withCredentials: true })
      .then((res) => {
        if (!mounted) return;
        setSubmission(res.data);
        setScores(CRITERIA.map((c) => Number(res.data?.[c.key]) || 0));
      })
      .catch((err) => {
        if (mounted) setError(err.response?.status === 404 ? 'Submission not found.' : 'Failed to load submission details.');
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [id]);

  const total = scores.reduce((sum, value) => sum + Number(value || 0), 0);

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage(null);
    try {
      const evaluation = CRITERIA.map((c, i) => ({ title: c.title, value: Number(scores[i]) || 0, max: c.max }));
      const res = await axios.post(`${URL}/mark_entry`, { evaluation, subid: submission.submission_id || id }, { withCredentials: true });
      const status = res.data.total >= PASS_MARK ? 'ACCEPTED' : 'REJECTED';
      setSubmission((prev) => ({ ...prev, status, total_mark: res.data.total }));
      setSaveMessage({ type: 'success', text: `Evaluation saved: ${res.data.total}/100 (${status}). The team and their SPOC have been emailed.` });
    } catch (err) {
      setSaveMessage({ type: 'error', text: err.response?.data?.message || 'Could not save the evaluation, please try again' });
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (date) =>
    date ? new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A';

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

  const status = String(submission.status || 'PENDING').toUpperCase();
  const evaluated = status === 'ACCEPTED' || status === 'REJECTED';

  return (
    <div className="min-h-screen bg-[#F7F8FC] py-10 px-4 sm:px-8 transition-all duration-300">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <Breadcrumb />
          <div className="flex items-center gap-3">
            <DeleteSubmissionButton
              submissionId={submission.submission_id || id}
              className="rounded-xl"
              onDeleted={() => navigate(-1)}
            />
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
              <InfoRow label="Description">{submission.description}</InfoRow>
              <InfoRow label="Team Name">{submission.team_name}</InfoRow>
              <InfoRow label="College">{submission.college_name}</InfoRow>
              <InfoRow label="Submitted Date">{formatDate(submission.submitted_date)}</InfoRow>
              <InfoRow label="Status">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyle(status)}`}>{status}</span>
                {evaluated && submission.total_mark != null && (
                  <span className="ml-3 font-medium">{submission.total_mark}/100</span>
                )}
              </InfoRow>
            </tbody>
          </table>
        </div>

        {/* Solution document */}
        <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 border border-[#E2E8F0]">
          <h2 className="text-xl font-semibold mb-4 text-[#1A202C]">Solution Document</h2>
          <PDFViewer url={submission.solution_document ? `${URL}/${submission.solution_document}` : null} />
        </div>

        {/* Evaluation */}
        <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 border border-[#E2E8F0]">
          <h2 className="text-xl font-semibold mb-1 text-[#1A202C]">Evaluation</h2>
          <p className="text-sm text-[#718096] mb-6">
            Score each criterion. {PASS_MARK} or more out of 100 marks the solution as ACCEPTED, below that as REJECTED.
            {evaluated && ' Saving again updates the marks and emails the team again.'}
          </p>

          <div className="space-y-4">
            {CRITERIA.map((c, index) => (
              <div key={c.key} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <span className="font-medium text-[#1A202C]">{c.title} <span className="text-[#718096]">(out of {c.max})</span></span>
                <input
                  type="number"
                  min="0"
                  max={c.max}
                  value={scores[index]}
                  onChange={(e) => {
                    const value = Math.min(c.max, Math.max(0, Number(e.target.value) || 0));
                    setScores((prev) => prev.map((v, i) => (i === index ? value : v)));
                  }}
                  className="w-28 border border-[#E2E8F0] rounded-xl px-3 py-2 text-center focus:ring-2 focus:ring-[#FF9900] focus:outline-none"
                />
              </div>
            ))}
          </div>

          <p className="text-center text-lg font-semibold mt-6 text-[#1A202C]">
            Total Marks: <span className="text-[#FF9900]">{total} / 100</span>
            <span className={`ml-3 px-2 py-1 rounded-full text-xs font-medium ${statusStyle(total >= PASS_MARK ? 'ACCEPTED' : 'REJECTED')}`}>
              {total >= PASS_MARK ? 'ACCEPTED' : 'REJECTED'}
            </span>
          </p>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full mt-6 bg-[#FF9900] text-white py-2.5 rounded-xl font-medium hover:bg-[#e68900] transition-colors disabled:opacity-60"
          >
            {saving ? 'Saving...' : evaluated ? 'Update Evaluation' : 'Save Evaluation'}
          </button>

          {saveMessage && (
            <p className={`text-center mt-3 font-medium ${saveMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
              {saveMessage.text}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubmissionDetail;
