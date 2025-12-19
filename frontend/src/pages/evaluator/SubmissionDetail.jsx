import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { URL } from "../../Utils";
import samplePdf from "../../assets/sample.pdf";

// --- Helper Component for the Table Rows ---
const InfoRow = ({ label, value, isEven }) => ( 
  <div className={`flex flex-col sm:flex-row border-b border-gray-100 ${isEven ? 'bg-orange-50/30' : 'bg-white'}`}>
    <div className="sm:w-1/3 p-4 font-semibold text-gray-700 sm:border-r border-gray-100">
      {label}
    </div>
    <div className="sm:w-2/3 p-4 text-gray-600 break-words">
      {value || "N/A"}
    </div>
  </div>
);

const PDFViewer = ({ url }) => {
  console.log(url);
  
  const file = url || samplePdf;

  return (
    <div className="w-full bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* PDF Controls */}
      <div className="flex justify-between items-center bg-gray-50 px-4 py-3 border-b border-gray-200">
        <span className="text-gray-600 font-medium">Document Preview</span>
        <div className="space-x-3">
          <a
            href={file}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 text-sm font-medium text-[#fc8f00] border border-[#fc8f00] rounded hover:bg-[#fc8f00] hover:text-white transition-colors"
          >
            View Fullscreen
          </a>
          <a
            href={file}
            download
            className="px-4 py-2 text-sm font-medium text-white bg-[#fc8f00] rounded hover:bg-[#e68100] transition-colors"
          >
            Download
          </a>
        </div>
      </div>

      {/* PDF Object */}
      <div className="w-full bg-gray-100">
        <div className="h-72 md:h-[60vh] lg:h-[80vh] w-full">
          <object data={file} type="application/pdf" width="100%" height="100%">
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <p className="mb-2">This browser does not support embedded PDFs.</p>
            <a href={file} className="text-[#fc8f00] underline font-medium">
              Click here to download
            </a>
          </div>
          </object>
        </div>
      </div>
    </div>
  );
};

const SubmissionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  console.log(id);
  

  // Evaluation State
  const [marks, setMarks] = useState('');
  const [feedback, setFeedback] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetchSubmission = async () => {
      try {
        const res = await axios.get(`${URL}/submissions/${id}`);
        console.log(res.data.solution_document);
        
        setSubmission(res.data);
      } catch (err) {
        console.error("Failed to fetch submission details", err);
        setError("Failed to load submission details.");
      } finally {
        setLoading(false);
      }
    };
    fetchSubmission();
  }, [id]);

  const handleSave = () => {
    const submissionId = submission?.ID || id;
    console.log({ submissionId, marks, feedback });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // Helper to format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) return <div className="p-10 text-center text-gray-500">Loading...</div>;
  if (error) return <div className="p-10 text-center text-red-500">{error}</div>;
  if (!submission) return <div className="p-10 text-center text-gray-500">Submission not found.</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-8">
      
      {/* Top Header with Back Button */}
      <div className="max-w-6xl mx-auto mb-6">
        <button
          onClick={() => navigate(-1)}
          className="bg-[#fc8f00] text-white px-6 py-2 rounded shadow hover:bg-[#e68100] transition-colors duration-300 flex items-center gap-2"
        >
          &larr; Back
        </button>
      </div>

      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* SECTION 1: Submission Information Table */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-2xl font-bold text-[#4a4a4a] mb-4">Submission Information</h2>
          <div className="bg-white shadow-lg border border-gray-200 rounded-lg overflow-hidden">
            {/* Note: Adjusting field keys below (e.g., PS_TITLE) based on your API response structure */}
            <InfoRow label="Submission ID" value={submission.submission_id} isEven={true} />
            <InfoRow label="Problem Title" value={submission.problem_title || "Image based breed recognition for cattle and buffaloes of India"} isEven={false} />
            <InfoRow label="Submission Title" value={submission.submission_title} isEven={true} />
            <InfoRow label="Description" value={submission.description} isEven={false} />
            <InfoRow label="Team Name" value={submission.team_name || submission.TEAM_ID} isEven={true} />
            <InfoRow label="SPOC ID" value={submission.spoc_id || "N/A"} isEven={false} />
            <InfoRow label="Submitted Date" value={formatDate(submission.submitted_date || "2025-12-07")} isEven={true} />
          </div>
        </motion.div>

        {/* SECTION 2: PDF Preview with Options */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <h2 className="text-2xl font-bold text-[#4a4a4a] mb-4">Solution Document</h2>
          <div className="w-full">
            {console.log(`${URL}/` +submission.solution_document)
            }
            <PDFViewer url={`${URL}/`+submission.solution_document} />
            </div>
        </motion.div>

        {/* SECTION 3: Evaluation (Unchanged) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="bg-white shadow-2xl border border-gray-200 rounded-2xl p-8"
        >
          <h2 className="text-2xl font-semibold text-[#fc8f00] mb-6 text-center">Evaluator’s Section</h2>

          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 mb-4">
            <label className="text-gray-700 font-medium mb-2 sm:mb-0">Marks (out of 100):</label>
            <input
              type="number"
              min="0"
              max="100"
              value={marks}
              onChange={(e) => setMarks(e.target.value)}
              className="w-40 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-[#fc8f00] focus:border-[#fc8f00]"
              placeholder="Enter marks"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">Feedback:</label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Write your feedback here..."
              rows="4"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm resize-none focus:ring-[#fc8f00] focus:border-[#fc8f00]"
            />
          </div>

          <button
            onClick={handleSave}
            className="bg-[#fc8f00] text-white px-6 py-2 rounded-lg hover:bg-[#e68100] transition-colors duration-300"
          >
            Save Evaluation
          </button>

          {saved && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-green-600 font-medium mt-3 text-center"
            >
              ✅ Evaluation saved successfully!
            </motion.p>
          )}
        </motion.div>

      </div>
    </div>
  );
};

export default SubmissionDetail;