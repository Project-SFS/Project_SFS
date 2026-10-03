import { useState, useEffect } from "react";
import axios from "axios";
import { URL } from "../../Utils";
import { toast, Toaster } from "react-hot-toast";
import { FiSave, FiX } from "react-icons/fi";

import { useNavigate } from "react-router-dom"; // Added import

// "2026-10-31" -> "31 Oct 2026"

// Create a challenge, or edit one when editId is given. Challenges have no deadline: an admin closes them.
const ProblemStatementForm = ({ editId }) => {
  const navigate = useNavigate(); // Added hook
  const editing = Boolean(editId);
  const [loadingProblem, setLoadingProblem] = useState(editing);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");// User asked for Category, mapping Dept to it or separate? specific request: "category". Detail view usually shows Dept as category. I'll stick to 'Department' as the field name but label it Category/Department to be safe, or just add Category.
  const [category, setCategory] = useState("");
  // the same fields as the Excel import template
  const [domain, setDomain] = useState("");
  const [outcomes, setOutcomes] = useState("");
  const [requirements, setRequirements] = useState("");
  const [technology, setTechnology] = useState("");

  // edit mode: start from the problem as it is stored
  useEffect(() => {
    if (!editing) return;
    axios.get(`${URL}/problems/${editId}`, { withCredentials: true })
      .then((res) => {
        const p = res.data?.problems?.[0];
        if (!p) throw new Error("not found");
        setTitle(p.TITLE || "");
        setDescription(p.DESCRIPTION || "");
        setCategory(String(p.CATEGORY || "").toLowerCase());
        setDomain(p.DOMAIN || "");
        setOutcomes(p.EXPECTED_OUTCOMES || "");
        setRequirements(p.REQUIREMENTS || "");
        setTechnology(p.TECHNOLOGY || "");
      })
      .catch(() => setLoadError("This challenge could not be loaded."))
      .finally(() => setLoadingProblem(false));
  }, [editing, editId]);

  const saveEdit = async () => {
    setSaving(true);
    try {
      const res = await axios.put(`${URL}/problems/${editId}`, {
        title, description, category, domain, outcomes, requirements, technology,
      }, { withCredentials: true });
      toast.success("Challenge saved", { position: "top-center", duration: 4000 });
      setTimeout(() => navigate(`/admin/problems/${editId}/details`), 1200);
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not save the challenge", { position: "top-center" });
      setSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editing) return saveEdit();

    try {
      const response = await axios.post(`${URL}/addproblems`, {
        title: title,
        description: description,
        category: category,
        domain,
        outcomes,
        requirements,
        technology,
      },
      {withCredentials:true}
    );


      const problem = toast.success("Challenge Added Successfully", {
        position: "top-center",
      });

      axios.post(`${URL}/send_mail_to_spoc`, { Problem : title }).catch(() => {})

      // Clear form and navigate back
      setTitle("");
      setDescription("");
      setCategory("");
      setDomain("");
      setOutcomes("");
      setRequirements("");
      setTechnology("");

      // Navigate back after delay
      setTimeout(() => navigate(-1), 1000);

      toast.dismiss(problem)

    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to Add Challenge", { position: "top-center" });
    }

  };

  if (editing && (loadingProblem || loadError)) {
    return (
      <div className="min-h-screen bg-[#F7F8FC] flex items-start justify-center pt-20 px-6">
        <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-8 text-center max-w-md w-full">
          {loadingProblem ? <p className="text-gray-600">Loading challenge...</p> : (
            <>
              <p className="text-[#1A202C]">{loadError}</p>
              <button onClick={() => navigate("/admin/problems")} className="mt-4 px-4 py-2 rounded-xl bg-[#FF9900] text-white">Back to challenges</button>
            </>
          )}
        </div>
      </div>
    );
  }

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
          <h2 className="text-2xl font-bold text-[#1A202C]">{editing ? "Edit Challenge" : "Create Challenge"}</h2>
          <p className="text-[#718096] text-sm mt-1">
            {editing ? "Update the details below and click Save Changes." : "Fill in the details to post a new challenge for teams. It stays open until you close it."}
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Title (Full Width) */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-[#4A5568] mb-2">Challenge Title</label>
              <input
                type="text"
                placeholder="Enter the title of the challenge"
                className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#FF9900]/20 focus:border-[#FF9900] transition-colors outline-none text-[#2D3748]"
                onChange={(e) => setTitle(e.target.value)}
                value={title}
                maxLength={300}
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
                <option value="software">Software</option>
                <option value="hardware">Hardware</option>
                <option value="combined">Combined (Hardware + Software)</option>

              </select>
            </div>

            {/* Description (Full Width) */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-[#4A5568] mb-2">Description</label>
              <textarea
                placeholder="Detailed description of the challenge..."
                rows="5"
                className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#FF9900]/20 focus:border-[#FF9900] transition-colors outline-none text-[#2D3748]"
                onChange={(e) => setDescription(e.target.value)}
                value={description}
                required
              />
            </div>




            {/* Domain */}
            <div>
              <label className="block text-sm font-semibold text-[#4A5568] mb-2">Domain</label>
              <input
                type="text"
                placeholder="e.g. Automotive, Manufacturing, Energy"
                maxLength={200}
                className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#FF9900]/20 focus:border-[#FF9900] transition-colors outline-none text-[#2D3748]"
                onChange={(e) => setDomain(e.target.value)}
                value={domain}
              />
            </div>

            {/* Technology */}
            <div>
              <label className="block text-sm font-semibold text-[#4A5568] mb-2">Technology</label>
              <input
                type="text"
                placeholder="e.g. IoT, Machine Learning, Embedded C"
                maxLength={500}
                className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#FF9900]/20 focus:border-[#FF9900] transition-colors outline-none text-[#2D3748]"
                onChange={(e) => setTechnology(e.target.value)}
                value={technology}
              />
            </div>

            {/* Expected Outcomes */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-[#4A5568] mb-2">Expected Outcomes</label>
              <textarea
                rows="3"
                placeholder="What a good solution should deliver..."
                className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#FF9900]/20 focus:border-[#FF9900] transition-colors outline-none text-[#2D3748]"
                onChange={(e) => setOutcomes(e.target.value)}
                value={outcomes}
              />
            </div>

            {/* Requirements */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-[#4A5568] mb-2">Requirements</label>
              <textarea
                rows="3"
                placeholder="Constraints, data or skills needed..."
                className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#FF9900]/20 focus:border-[#FF9900] transition-colors outline-none text-[#2D3748]"
                onChange={(e) => setRequirements(e.target.value)}
                value={requirements}
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
              {editing ? (saving ? "Saving…" : "Save Changes") : "Create Challenge"}
            </button>
          </div>
        </form>
      </div>



      <Toaster />
    </div>
  );
};

export default ProblemStatementForm;
