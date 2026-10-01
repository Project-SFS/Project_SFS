import { useState } from "react";
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

  const [reference,setReference]=useState("");
  

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    
    try {
      const response = await axios.post(`${URL}/addproblems`, {
        title: title,
        description: description,
        sub_date: deadline,
        category: category,
        reference: reference,
      },
      {withCredentials:true}
    );


      const problem = toast.success("Problem Statement Added Successfully", {
        position: "top-center",
      });

      axios.post(`${URL}/send_mail_to_spoc`, { Problem : title }).catch(() => {})

      // Clear form and navigate back
      setTitle("");
      setDescription("");
      setCategory("");
      setYoutubeLink("");
      setDatasetLink("");

      // Navigate back after delay
      setTimeout(() => navigate(-1), 1000);

      toast.dismiss(problem)

    } catch (error) {
      toast.error("Failed to Add Problem Statement", { position: "top-center" });
    }

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
                value={deadline}
                required
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
