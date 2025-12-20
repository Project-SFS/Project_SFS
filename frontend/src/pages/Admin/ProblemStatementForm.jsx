import { useState,useEffect } from "react";
import axios from "axios";
import { URL } from "../../Utils";
import { toast, Toaster } from "react-hot-toast";
import { FiSave, FiX } from "react-icons/fi";

import { useNavigate } from "react-router-dom"; // Added import

const ProblemStatementForm = () => {
  const navigate = useNavigate(); // Added hook
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");// User asked for Category, mapping Dept to it or separate? specific request: "category". Detail view usually shows Dept as category. I'll stick to 'Department' as the field name but label it Category/Department to be safe, or just add Category.
  const [category, setCategory] = useState("");
  const [deadline, setDeadline] = useState("");
  const [youtubeLink, setYoutubeLink] = useState("");
  const [datasetLink, setDatasetLink] = useState("");

  // New: modal state and created item state
  const [showModal, setShowModal] = useState(false);
  const [createdProblem, setCreatedProblem] = useState(null);

  // Evaluator Logic
  const [evaluators, setEvaluators] = useState([]);
  const [selectedEvaluators, setSelectedEvaluators] = useState([]);
  const [evaluatorSearch, setEvaluatorSearch] = useState("");
  const [reference,setReference]=useState("");
  

  // Role Logic
  const [isEvaluator, setIsEvaluator] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    const fetchUserAndEvaluators = async () => {
      try {
        // 1. Get current user
        const userRes = await axios.get(`${URL}/cookie`, { withCredentials: true });
        const userData = userRes.data;
        const role = userData?.ROLE || userData?.role;
        const id = userData?.ID || userData?.id;

        setCurrentUserId(id);
        const isEval = role === "EVALUATOR";
        setIsEvaluator(isEval);

        // 2. If NOT Evaluator (i.e. Admin), fetch list of evaluators
        if (!isEval) {
          const res = await axios.get(`${URL}/evaluators`);
          setEvaluators(res.data || []);
        } else {
          // If Evaluator, pre-select themselves (logic optional here, mostly done in submit)
        }
      } catch (err) {
        console.error("Failed to fetch user or evaluators", err);
      }
    };
    fetchUserAndEvaluators();
  }, []);

  const filteredEvaluators = evaluators.filter(ev =>
    (ev.NAME && ev.NAME.toLowerCase().includes(evaluatorSearch.toLowerCase())) ||
    (ev.ID && String(ev.ID).toLowerCase().includes(evaluatorSearch.toLowerCase()))
  );

  console.log(currentUserId);
  

  const toggleEvaluator = (id) => {
    setSelectedEvaluators(prev =>
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    );
  };
  console.log(deadline.split('T')[0]);

  console.log("2025-12-30T18:30:00.000Z".split('T')[0]);
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${URL}/addproblems`, {
        title: title,
        description: description,
        sub_date: deadline,
        category: category,
        reference: reference,
        evaluators:currentUserId
      },
      {withCredentials:true}
    );

      console.log(response.data);

      toast.success("Problem Statement Added Successfully", {
        position: "top-center",
      });

      // Clear form and navigate back
      setTitle("");
      setDescription("");
      setCategory("");
      setYoutubeLink("");
      setDatasetLink("");
      setSelectedEvaluators([]);
      setEvaluatorSearch("");

      // Navigate back after delay
      setTimeout(() => navigate(-1), 1000);

    } catch (error) {
      console.log( error);
      toast.error("Failed to Add Problem Statement", { position: "top-center" });
    }

    console.log(deadline)
  };

  return (
    <div className="min-h-screen bg-[#F7F8FC] flex flex-col items-center justify-start pt-10 px-6">
      <div className="bg-white shadow-xl rounded-2xl w-full max-w-4xl p-8 border border-[#E2E8F0] relative"> {/* Added relative for positioning */}
        {/* Close Button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <FiX size={24} />
        </button>

        <div className="mb-8 border-b border-gray-100 pb-4">
          <h2 className="text-2xl font-bold text-[#1A202C]">Create Problem Statement</h2>
          <p className="text-[#718096] text-sm mt-1">Fill in the details to post a new problem for teams.</p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Title (Full Width) */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-[#4A5568] mb-2">Problem Statement Title</label>
              <input
                type="text"
                placeholder="Enter the title of the problem statement"
                className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#FF9900]/20 focus:border-[#FF9900] transition-colors outline-none text-[#2D3748]"
                onChange={(e) => setTitle(e.target.value)}
                value={title}
                required
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-semibold text-[#4A5568] mb-2">Category</label>
              <select
                className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#FF9900]/20 focus:border-[#FF9900] transition-colors outline-none text-[#2D3748] bg-white"
                onChange={(e) => setCategory(e.target.value)}
                value={category}
                required
              >
                <option value="">Select Category</option>
                <option value="hardware">Hardware</option>
                <option value="software">Software</option>
               

              </select>
            </div>

            {/* Description (Full Width) */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-[#4A5568] mb-2">Description</label>
              <textarea
                placeholder="Detailed description of the problem statement..."
                rows="5"
                className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#FF9900]/20 focus:border-[#FF9900] transition-colors outline-none text-[#2D3748]"
                onChange={(e) => setDescription(e.target.value)}
                value={description}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Enter Submission DeadLine
              </label>
              <input
                type="date"
                placeholder="Submission Deadline"
                className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:ring focus:ring-blue-300"
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>

            {/* YouTube Link */}
            <div>
              <label className="block text-sm font-semibold text-[#4A5568] mb-2">YouTube Video Link</label>
              <input
                type="url"
                placeholder="https://youtube.com/..."
                className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#FF9900]/20 focus:border-[#FF9900] transition-colors outline-none text-[#2D3748]"
                onChange={(e) => setReference(e.target.value)}
                value={reference}
              />
            </div>

            {/* Dataset Link */}
            <div>
              <label className="block text-sm font-semibold text-[#4A5568] mb-2">Dataset Link</label>
              <input
                type="url"
                placeholder="https://drive.google.com/..."
                className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#FF9900]/20 focus:border-[#FF9900] transition-colors outline-none text-[#2D3748]"
                onChange={(e) => setDatasetLink(e.target.value)}
                value={datasetLink}
              />
            </div>

            {/* Evaluator Assignment (Full Width) */}
            {/* Only show for Admin, hide for Evaluator */}
            {!isEvaluator && (
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-[#4A5568] mb-2">Assign Evaluators</label>
                <div className="border border-[#E2E8F0] rounded-xl p-4 bg-gray-50">
                  <input
                    type="text"
                    placeholder="Search evaluators by name or ID..."
                    className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 mb-3 text-sm focus:ring-2 focus:ring-[#FF9900]/20 outline-none"
                    value={evaluatorSearch}
                    onChange={(e) => setEvaluatorSearch(e.target.value)}
                  />
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {filteredEvaluators.length > 0 ? (
                      filteredEvaluators.map((evaluator) => (
                        <div key={evaluator.ID} className="flex items-center space-x-3 bg-white p-2 rounded-lg border border-gray-100">
                          <input
                            type="checkbox"
                            id={`eval-${evaluator.ID}`}
                            checked={selectedEvaluators.includes(evaluator.ID)}
                            onChange={() => toggleEvaluator(evaluator.ID)}
                            className="w-4 h-4 text-[#FF9900] border-gray-300 rounded focus:ring-[#FF9900]"
                          />
                          <label htmlFor={`eval-${evaluator.ID}`} className="text-sm text-gray-700 cursor-pointer flex-1">
                            <span className="font-semibold">{evaluator.NAME}</span> <span className="text-gray-400 text-xs">({evaluator.ID})</span>
                          </label>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-2">No evaluators found</p>
                    )}
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    {selectedEvaluators.length} evaluator(s) selected
                  </div>
                </div>
              </div>
            )}

          </div>

          <div className="flex justify-end space-x-4 pt-8 border-t border-gray-100">
            <button
              type="button"
              className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium transition-colors"
              onClick={() => navigate(-1)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#FF9900] text-white hover:bg-[#E68500] font-medium shadow-md hover:shadow-lg transition-all flex items-center gap-2"
            >
              <FiSave />
              Create Problem Statement
            </button>
          </div>
        </form>
      </div>



      <Toaster />
    </div>
  );
};

export default ProblemStatementForm;
