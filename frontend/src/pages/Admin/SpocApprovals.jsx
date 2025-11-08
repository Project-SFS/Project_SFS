import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const SpocApprovals = () => {
  const [selectedAction, setSelectedAction] = useState(null);
  const [selectedCollege, setSelectedCollege] = useState(null);
  const [toast, setToast] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [step, setStep] = useState("confirm"); // 'confirm' or 'sent'

  const data = [
    {
      id: 1,
      name: "ABC College of Engineering",
      email: "contact@abcengg.edu.in",
      date: "2025-11-02",
    },
    {
      id: 2,
      name: "XYZ Institute of Technology",
      email: "info@xyztech.edu.in",
      date: "2025-11-01",
    },
    {
      id: 3,
      name: "Sunshine College of Arts",
      email: "hello@sunshine.edu.in",
      date: "2025-10-30",
    },
  ];

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAction = (college, action) => {
    setSelectedCollege(college);
    setSelectedAction(action);
    setStep("confirm");
    setShowPopup(true);
  };

  const confirmAction = () => {
    if (!selectedCollege) return;

    // Step 1 → switch to "sent" message
    setStep("sent");

    // Step 2 → show toast and auto-close popup
    setTimeout(() => {
      if (selectedAction === "approve") {
        showToast(`${selectedCollege.name} approved successfully.`, "success");
      } else {
        showToast(`${selectedCollege.name} rejected successfully.`, "error");
      }
      setShowPopup(false);
      setSelectedAction(null);
      setSelectedCollege(null);
    }, 2000); // 2 seconds before auto-closing
  };

  const filteredData = data.filter(
    (college) =>
      college.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      college.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F7F8FC] px-6 py-8 transition-all duration-300">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[#1A202C] mb-1">
          SPOC Approvals
        </h1>
        <p className="text-[#718096] text-sm">
          Review and manage SPOC approval requests.
        </p>
      </div>

      {/* Summary Card */}
      <div className="bg-white shadow-sm rounded-2xl p-5 border border-[#E2E8F0] mb-8">
        <h2 className="text-lg font-medium text-[#1A202C] mb-2">
          Total Approvals Received
        </h2>
        <p className="text-3xl font-bold text-[#FF9900]">{data.length}</p>
      </div>

      {/* Search Bar */}
      <div className="mb-5 flex justify-between items-center">
        <input
          type="text"
          placeholder="Search by college name or email..."
          className="w-full md:w-1/2 px-4 py-2 text-sm border border-[#E2E8F0] rounded-xl focus:ring-2 focus:ring-[#FF9900] focus:outline-none transition-all"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="bg-white shadow-sm rounded-2xl border border-[#E2E8F0] overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-[#F7F8FC] text-[#718096]">
            <tr>
              <th className="text-left py-3 px-4 font-medium">College Name</th>
              <th className="text-left py-3 px-4 font-medium">Email</th>
              <th className="text-left py-3 px-4 font-medium">Date Requested</th>
              <th className="text-center py-3 px-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length > 0 ? (
              filteredData.map((college) => (
                <tr
                  key={college.id}
                  className="hover:bg-gray-50 border-t border-[#E2E8F0] transition-all"
                >
                  <td className="py-3 px-4 text-[#1A202C] font-medium">
                    {college.name}
                  </td>
                  <td className="py-3 px-4 text-[#718096]">{college.email}</td>
                  <td className="py-3 px-4 text-[#A0AEC0]">{college.date}</td>
                  <td className="py-3 px-4 text-center space-x-2">
                    <button
                      onClick={() => handleAction(college, "approve")}
                      className="bg-[#48BB78] hover:bg-green-600 text-white px-4 py-1.5 rounded-xl text-sm transition-all"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleAction(college, "reject")}
                      className="text-red-600 border border-red-300 hover:bg-red-50 px-4 py-1.5 rounded-xl text-sm transition-all"
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="4"
                  className="py-5 text-center text-[#A0AEC0] italic"
                >
                  No matching results found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Popup Modal with Animation */}
      <AnimatePresence>
        {showPopup && (
          <motion.div
            key="popup"
            className="fixed inset-0 bg-white/30 backdrop-blur-md flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              key={step}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-2xl shadow-xl p-6 w-[90%] max-w-md"
            >
              {step === "confirm" ? (
                <>
                  <h2 className="text-lg font-semibold text-[#1A202C] flex items-center gap-2">
                    {selectedAction === "approve" ? (
                      <span className="text-[#48BB78]">✔</span>
                    ) : (
                      <span className="text-red-500">✖</span>
                    )}
                    {selectedAction === "approve"
                      ? "Confirm Approval"
                      : "Confirm Rejection"}
                  </h2>
                  <p className="text-[#718096] mt-3 text-sm">
                    Are you sure you want to{" "}
                    <span
                      className={
                        selectedAction === "approve"
                          ? "text-[#48BB78] font-medium"
                          : "text-red-500 font-medium"
                      }
                    >
                      {selectedAction}
                    </span>{" "}
                    <b>{selectedCollege?.name}</b>?
                  </p>
                  <div className="flex justify-end mt-6 space-x-3">
                    <button
                      onClick={() => setShowPopup(false)}
                      className="px-4 py-1.5 text-[#1A202C] bg-gray-100 hover:bg-gray-200 rounded-xl text-sm transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmAction}
                      className={`px-4 py-1.5 rounded-xl text-sm text-white transition-all ${
                        selectedAction === "approve"
                          ? "bg-[#48BB78] hover:bg-green-600"
                          : "bg-red-500 hover:bg-red-600"
                      }`}
                    >
                      {selectedAction === "approve" ? "Approve" : "Reject"}
                    </button>
                  </div>
                </>
              ) : (
                <motion.div
                  key="sent"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="text-center"
                >
                  <h2 className="text-lg font-semibold text-[#1A202C] mb-3">
                    {selectedAction === "approve"
                      ? "✅ Approval Mail Sent!"
                      : "📤 Rejection Mail Sent!"}
                  </h2>
                  <p className="text-[#718096] text-sm">
                    Mail has been successfully sent to{" "}
                    <span className="font-medium text-brand-orange">
                      {selectedCollege?.email}
                    </span>
                    .
                  </p>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium transition-all animate-slideUp ${
            toast.type === "success" ? "bg-[#48BB78]" : "bg-red-500"
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default SpocApprovals;
