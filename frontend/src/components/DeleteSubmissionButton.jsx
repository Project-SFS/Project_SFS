import { useState } from "react";
import axios from "axios";
import { URL } from "../Utils";

// Deletes (or, for a team, withdraws) one submission after a confirmation.
// The team keeps its problem assignment, so it can submit again afterwards.
export default function DeleteSubmissionButton({
  submissionId,
  label = "Delete submission",
  confirmText = "Delete this submission and its PDF? The team will be emailed and can submit again. This cannot be undone.",
  onDeleted,
  className = "",
}) {
  const [busy, setBusy] = useState(false);

  const handleClick = async () => {
    if (!submissionId || !window.confirm(confirmText)) return;
    setBusy(true);
    try {
      await axios.post(`${URL}/delete_submission`, { id: submissionId });
      onDeleted?.();
    } catch (err) {
      window.alert(err.response?.data?.message || "Could not delete the submission, please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      className={`px-4 py-2 rounded text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-300 ${className}`}
    >
      {busy ? "Deleting..." : label}
    </button>
  );
}
