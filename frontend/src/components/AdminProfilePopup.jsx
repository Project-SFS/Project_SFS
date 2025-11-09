import React from "react";

const AdminProfilePopup = ({ isOpen, onClose }) => {
  if (!isOpen) return null; // <-- this ensures it's hidden when false

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="bg-white text-black rounded-xl shadow-2xl p-6 w-[90%] max-w-sm relative">
        <h2 className="text-lg font-semibold mb-4">Admin Profile</h2>
        <p>Name: Admin User</p>
        <p>Email: admin@example.com</p>

        <button
          onClick={onClose}
          className="mt-5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default AdminProfilePopup;
