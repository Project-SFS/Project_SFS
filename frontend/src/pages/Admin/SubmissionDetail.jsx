import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import Button from '../../components/common/button';
import Breadcrumb from '../../components/common/Breadcrumb';
import { FiEdit, FiSave, FiArrowLeft, FiChevronLeft, FiChevronRight, FiDownload } from 'react-icons/fi';
import axios from 'axios';
import { URL } from '../../Utils';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set up the worker for react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const SubmissionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [marks, setMarks] = useState('');
  const [comments, setComments] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);

  useEffect(() => {
    const fetchSubmission = async () => {
      try {
        const response = await axios.post(`${URL}/submissions/${id}`).then(res=> res.data
        )
       
        
        setSubmission(response.data);
        if (response.data.marks) setMarks(response.data.marks); // Assuming backend has marks
        if (response.data.comments) setComments(response.data.comments);
      } catch (err) {
        console.error("Error fetching submission:", err);
        setError("Failed to load  details.");
      } finally {
        setLoading(false);
      }
    };
    fetchSubmission();
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-10 flex justify-center items-center">
        <div className="text-xl text-gray-600">Loading submission details...</div>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="min-h-screen bg-gray-50 py-10">
        <div className="max-w-4xl mx-auto bg-white shadow rounded-lg p-8">
          <h1>{error || "Submission not found"}</h1>
          <Button onClick={() => navigate(-1)} className="mt-4 bg-[#FF9900] text-white px-4 py-2 rounded">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  // Map backend fields to UI if needed, or use directly
  // Backend columns: ID, SOL_TITLE, SOL_DESCRIPTION, SOL_LINK, SUB_DATE, STATUS (or SUB_STATUS), teamName, spocId, problemTitle
  const submissionId = submission.ID || submission.id;
  const solTitle = submission.SOL_TITLE || submission.sol_title || 'N/A';
  const problemTitle = submission.problemTitle || submission.PROBLEM_TITLE || 'N/A';
  const solDescription = submission.SOL_DESCRIPTION || submission.sol_description || 'N/A';
  const teamName = submission.teamName || submission.TEAM_NAME || submission.TEAM_ID || 'N/A';
  const spocId = submission.spocId || submission.SPOC_ID || 'N/A';
  const rawStatus = submission.STATUS || submission.status || submission.SUB_STATUS || submission.sub_status;
  const displayStatus = rawStatus ? rawStatus.toUpperCase() : 'PENDING';

  const rawDate = submission.SUB_DATE || submission.sub_date;
  const displayDate = rawDate ? new Date(rawDate).toLocaleDateString() : 'N/A';

  const pdfUrl = submission.SOL_LINK || submission.sol_link;

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const goToPrevPage = () => {
    setPageNumber((prev) => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setPageNumber((prev) => Math.min(prev + 1, numPages));
  };

  return (
    <div className="min-h-screen bg-[#F7F8FC] py-10 px-8 transition-all duration-300">
      <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-sm p-10 border border-[#E2E8F0]">
        <div className="flex justify-between items-center mb-6">
          <Breadcrumb />
          <Button
            onClick={() => navigate(-1)}
            className="!bg-[#FF9900] !hover:bg-[#e68900] text-white px-4 py-2 rounded-xl flex items-center space-x-2 font-medium shadow-sm hover:shadow-md transition-all duration-200"
          >
            <FiArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </Button>
        </div>

        {/* Submission Information Table */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-[#1A202C]">Submission </h2>
          <table className="w-full text-left border-collapse border border-[#E2E8F0] rounded-xl overflow-hidden">
            <tbody>
              <tr className="border-b border-[#E2E8F0]">
                <td className="p-4 font-medium bg-[#FF9900]/5 w-1/3 text-[#1A202C]">Submission ID</td>
                <td className="p-4 text-[#1A202C]">{submissionId}</td>
              </tr>
              <tr className="border-b border-[#E2E8F0]">
                <td className="p-4 font-medium bg-[#FF9900]/5 text-[#1A202C]">Problem Title</td>
                <td className="p-4 text-[#1A202C]">{problemTitle}</td>
              </tr>
              <tr className="border-b border-[#E2E8F0]">
                <td className="p-4 font-medium bg-[#FF9900]/5 text-[#1A202C]">Submission Title</td>
                <td className="p-4 text-[#1A202C]">{solTitle}</td>
              </tr>
              <tr className="border-b border-[#E2E8F0]">
                <td className="p-4 font-medium bg-[#FF9900]/5 text-[#1A202C]">Description</td>
                <td className="p-4 text-[#1A202C]">{solDescription}</td>
              </tr>
              <tr className="border-b border-[#E2E8F0]">
                <td className="p-4 font-medium bg-[#FF9900]/5 text-[#1A202C]">Team Name</td>
                <td className="p-4 text-[#1A202C]">{teamName}</td>
              </tr>
              <tr className="border-b border-[#E2E8F0]">
                <td className="p-4 font-medium bg-[#FF9900]/5 text-[#1A202C]">SPOC ID</td>
                <td className="p-4 text-[#1A202C]">{spocId}</td>
              </tr>
              <tr className="border-b border-[#E2E8F0]">
                <td className="p-4 font-medium bg-[#FF9900]/5 text-[#1A202C]">Submitted Date</td>
                <td className="p-4 text-[#1A202C]">{displayDate}</td>
              </tr>
              <tr className="border-b border-[#E2E8F0]">
                <td className="p-4 font-medium bg-[#FF9900]/5 text-[#1A202C]">Status</td>
                <td className="p-4 flex justify-between items-center text-[#1A202C]">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${displayStatus === 'Evaluated' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {displayStatus}
                  </span>
                  <div className="flex space-x-2">
                    {!isEditing ? (
                      <Button
                        onClick={() => setIsEditing(true)}
                        className="bg-[#FF9900] hover:bg-[#e68900] text-white px-3 py-1 rounded-xl text-sm flex items-center space-x-1 shadow-md transition-all"
                      >
                        <FiEdit className="w-4 h-4" />
                        <span>Edit</span>
                      </Button>
                    ) : (
                      <Button
                        onClick={() => {
                          // Implement save logic later or mock it for now
                          setIsEditing(false);
                          alert('Save functionality not implemented yet.');
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-xl text-sm flex items-center space-x-1 shadow-md transition-all"
                      >
                        <FiSave className="w-4 h-4" />
                        <span>Save</span>
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
              <tr className="border-b border-[#E2E8F0]">
                <td className="p-4 font-medium bg-[#FF9900]/5 text-[#1A202C]">Marks</td>
                <td className="p-4 text-[#1A202C]">
                  {isEditing ? (
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={marks}
                      onChange={(e) => setMarks(e.target.value)}
                      className="w-20 border border-[#E2E8F0] rounded-xl px-2 py-1 text-center bg-white text-[#1A202C]"
                      placeholder="Marks"
                    />
                  ) : (
                    marks ? `${marks}/100` : 'Not evaluated'
                  )}
                </td>
              </tr>
              <tr>
                <td className="p-4 font-medium bg-[#FF9900]/5 text-[#1A202C]">Comments</td>
                <td className="p-4 text-[#1A202C]">
                  {isEditing ? (
                    <textarea
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      rows="2"
                      className="w-full border border-[#E2E8F0] rounded-xl px-2 py-1 bg-white text-[#1A202C]"
                      placeholder="Comments"
                    />
                  ) : (
                    comments || 'No comments'
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* PDF Preview Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-[#1A202C]">PDF Preview</h2>
          <div className="border border-[#E2E8F0] rounded-xl overflow-hidden bg-[#F7F8FC]">
            <div className="flex justify-center items-center p-4">
              {pdfUrl ? (
                <Document
                  file={pdfUrl}
                  onLoadSuccess={onDocumentLoadSuccess}
                  onLoadError={(error) => console.error('Error loading PDF:', error)}
                  loading={
                    <div className="flex items-center justify-center h-96">
                      <div className="text-[#1A202C]">Loading PDF...</div>
                    </div>
                  }
                >
                  <Page
                    pageNumber={pageNumber}
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                    className="shadow-lg"
                  />
                </Document>
              ) : (
                <div className="p-10 text-gray-500">No PDF Link Available</div>
              )}

            </div>

            {/* PDF Navigation Controls */}
            {numPages && (
              <div className="flex items-center justify-between bg-white px-6 py-3 border-t border-[#E2E8F0]">
                <Button
                  onClick={goToPrevPage}
                  disabled={pageNumber <= 1}
                  className={`flex items-center space-x-1 px-4 py-2 rounded-xl transition-all ${pageNumber <= 1
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-[#FF9900] hover:bg-[#e68900] text-white shadow-md'
                    }`}
                >
                  <FiChevronLeft className="w-5 h-5" />
                  <span>Previous</span>
                </Button>

                <div className="text-[#1A202C] font-medium">
                  Page {pageNumber} of {numPages}
                </div>

                <Button
                  onClick={goToNextPage}
                  disabled={pageNumber >= numPages}
                  className={`flex items-center space-x-1 px-4 py-2 rounded-xl transition-all ${pageNumber >= numPages
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-[#FF9900] hover:bg-[#e68900] text-white shadow-md'
                    }`}
                >
                  <span>Next</span>
                  <FiChevronRight className="w-5 h-5" />
                </Button>
              </div>
            )}

            {/* Download Button */}
            {pdfUrl && (
              <div className="flex justify-center bg-white px-6 py-3 border-t border-[#E2E8F0]">
                <a
                  href={pdfUrl}
                  download
                  className="bg-[#FF9900] hover:bg-[#e68900] text-white px-4 py-2 rounded-xl flex items-center space-x-2 font-medium shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <FiDownload className="w-5 h-5" />
                  <span>Download PDF</span>
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmissionDetail;