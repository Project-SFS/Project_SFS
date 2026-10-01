import { StatusBadge } from "../../submissionStatus";

// Status pill for a team's submission: not submitted / awaiting review / changes needed / approved / rejected
export default function SubmissionStatus({ submission }) {
  if (!submission) {
    return <span className="whitespace-nowrap text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">Not submitted</span>;
  }
  return <StatusBadge status={submission.STATUS} />;
}
