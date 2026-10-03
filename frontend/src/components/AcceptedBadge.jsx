// "2/3 accepted": how many concepts of a team are already accepted (a team can have at most `max`)
const AcceptedBadge = ({ count = 0, max = 3, className = "" }) => {
  const atLimit = count >= max;
  return (
    <span
      title={atLimit ? `This team already has ${max} accepted concepts (the maximum)` : `${count} of ${max} concepts accepted for this team`}
      className={`inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold ${atLimit ? "bg-green-100 text-green-800" : count > 0 ? "bg-orange-50 text-[#C05621]" : "bg-gray-100 text-gray-600"} ${className}`}
    >
      {count}/{max} accepted{atLimit ? " · limit" : ""}
    </span>
  );
};

export default AcceptedBadge;
