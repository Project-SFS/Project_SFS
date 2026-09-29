// Status pill for a team's submission: not submitted / pending / accepted / rejected
export default function SubmissionStatus({ submission }) {
  const status = submission ? String(submission.STATUS || "PENDING").toUpperCase() : "NONE";
  const styles = {
    NONE: "bg-gray-100 text-gray-600",
    PENDING: "bg-yellow-100 text-yellow-800",
    ACCEPTED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
  };
  const labels = {
    NONE: "Not submitted",
    PENDING: "Awaiting evaluation",
    ACCEPTED: "Accepted",
    REJECTED: "Rejected",
  };
  return (
    <span className={`whitespace-nowrap text-xs font-semibold px-2.5 py-1 rounded-full ${styles[status] || styles.PENDING}`}>
      {labels[status] || status}
    </span>
  );
}
