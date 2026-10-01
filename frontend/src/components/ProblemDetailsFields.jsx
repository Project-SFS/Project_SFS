// The problem statement template's extra fields (Domain, Technology, Expected Outcomes, Requirements),
// shown wherever a problem's details are opened. Takes the problem row as the API returns it.
const ProblemDetailsFields = ({ problem, className = "" }) => {
  if (!problem) return null;
  const tags = [
    ["Domain", problem.DOMAIN],
    ["Technology", problem.TECHNOLOGY],
  ].filter(([, v]) => v);
  const blocks = [
    ["Expected Outcomes", problem.EXPECTED_OUTCOMES],
    ["Requirements", problem.REQUIREMENTS],
  ].filter(([, v]) => v);
  if (!tags.length && !blocks.length) return null;

  return (
    <div className={`space-y-3 text-sm text-gray-700 ${className}`}>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map(([label, value]) => (
            <span key={label} className="inline-flex items-center gap-1 rounded-full bg-orange-50 border border-orange-200 px-3 py-1 text-xs">
              <span className="font-semibold text-[#c76f00]">{label}:</span> <span className="text-gray-800">{value}</span>
            </span>
          ))}
        </div>
      )}
      {blocks.map(([label, value]) => (
        <div key={label}>
          <div className="font-semibold text-gray-800">{label}</div>
          <p className="mt-0.5 leading-relaxed whitespace-pre-line">{value}</p>
        </div>
      ))}
    </div>
  );
};

export default ProblemDetailsFields;
