import { Toaster } from "react-hot-toast";
import { FiCheckCircle } from "react-icons/fi";
import Header from "./Header";
import sakthiLogo from "../assets/sakthi_auto.png";
import velMark from "../assets/Sakthiauto_vel.png";

// Shared frame for the Login and Register pages: the Sakthi Auto brand panel on one side, the form on
// the other. On small screens the brand panel becomes a compact strip above the form.
const HIGHLIGHTS = [
  "Real industry challenges from Sakthi Auto",
  "Teams submit their solutions and get reviewed with clear feedback",
  "SPOCs manage their college's teams in one place",
];

const AuthLayout = ({ title, subtitle, children }) => (
  <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 flex justify-center items-start px-4 pt-28 pb-12">
    <Header />
    <Toaster position="top-right" />
    <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden grid md:grid-cols-5">
      {/* Brand panel */}
      <div className="relative md:col-span-2 bg-[#494949] text-white overflow-hidden">
        <img src={velMark} alt="" aria-hidden className="pointer-events-none select-none absolute -right-10 -bottom-12 w-64 opacity-10" />
        <div className="relative h-full flex md:flex-col items-center md:items-start justify-center gap-6 p-6 md:p-10">
          <img src={sakthiLogo} alt="Sakthi Auto" className="w-36 md:w-56 h-auto" />
          <div className="hidden md:block">
            <div className="h-1 w-12 rounded-full bg-[#fc9300] mb-5" />
            <h2 className="text-2xl font-bold leading-snug">Solve For Sakthi</h2>
            <p className="text-white/70 mt-2 text-sm leading-relaxed">
              The innovation challenge connecting college teams with real engineering problems.
            </p>
            <ul className="mt-6 space-y-3">
              {HIGHLIGHTS.map((text) => (
                <li key={text} className="flex gap-2.5 text-sm text-white/85">
                  <FiCheckCircle className="text-[#fc9300] shrink-0 mt-0.5" /> <span>{text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="md:col-span-3 p-6 sm:p-10">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="text-gray-600 mt-1">{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  </div>
);

export default AuthLayout;
