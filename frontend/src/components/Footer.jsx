import { Link } from "react-router-dom";
import { FaFacebook, FaXTwitter, FaInstagram, FaLinkedin, FaYoutube } from "react-icons/fa6";
import { FiMail } from "react-icons/fi";

// Official Sakthi Auto Component handles (from the Sakthi Connect 2026 social media launch)
const SOCIALS = [
  { name: "YouTube", handle: "@SakthiAutoComponent", url: "https://www.youtube.com/@SakthiAutoComponent", icon: FaYoutube, hover: "hover:text-red-500" },
  { name: "Instagram", handle: "@sakthiautocomponent", url: "https://www.instagram.com/sakthiautocomponent", icon: FaInstagram, hover: "hover:text-pink-500" },
  { name: "Facebook", handle: "@SakthiSACL", url: "https://www.facebook.com/SakthiSACL", icon: FaFacebook, hover: "hover:text-blue-400" },
  { name: "LinkedIn", handle: "sakthi-auto-component-limited", url: "https://www.linkedin.com/company/sakthi-auto-component-limited", icon: FaLinkedin, hover: "hover:text-sky-400" },
  { name: "X", handle: "@SakthiSACL", url: "https://x.com/SakthiSACL", icon: FaXTwitter, hover: "hover:text-gray-300" },
];

const LINKS = [
  { name: "Home", path: "/" },
  // { name: "About us", path: "/about" },
  { name: "Explore Challenges", path: "/problemstatements" },
  { name: "Submit your Interest", path: "/interest" },
];

const Footer = () => {
  return (
    <footer className="bg-[#4a4a4a] text-white py-8 w-full">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">

        {/* Social Section */}
        <div className="flex flex-col items-center md:items-start">
          <span className="uppercase text-xl font-bold mb-3 text-[#fc8f00]">Follow Sakthi Auto</span>
          <div className="flex flex-wrap justify-center md:justify-start gap-5 mb-5">
            {SOCIALS.map(({ name, handle, url, icon: Icon, hover }) => (
              <a
                key={name}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Sakthi Auto on ${name} (${handle})`}
                title={`${name}: ${handle}`}
                className={`transition-all duration-200 hover:scale-110 ${hover}`}
              >
                <Icon size={28} />
              </a>
            ))}
          </div>
          <p className="text-sm text-gray-300">
            &copy; {new Date().getFullYear()} Solve for Sakthi. All rights reserved.
          </p>
        </div>

        {/* Quick links */}
        <div className="flex flex-col items-center md:items-start">
          <span className="uppercase text-xl font-bold mb-3 text-[#fc8f00]">Quick Links</span>
          <ul className="space-y-1.5">
            {LINKS.map(({ name, path }) => (
              <li key={path}>
                <Link to={path} className="text-gray-200 hover:text-[#fc8f00] transition-colors">{name}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact Section */}
        <div className="flex flex-col items-center md:items-start">
          <span className="uppercase text-xl font-bold mb-3 text-[#fc8f00]">Contact Us</span>
          <a href="mailto:hr@sakthiauto.com" className="inline-flex items-center gap-2 text-base text-gray-200 hover:text-[#fc8f00] transition-colors">
            <FiMail /> hr@sakthiauto.com
          </a>
        </div>
      </div>

      {/* Bottom Line for small screens */}
      {/* <div className="mt-6 border-t border-gray-500 pt-4 text-center text-sm text-gray-400 px-4">
        Designed with ❤️ by Solve for Sakthi Team
      </div> */}
    </footer>
  );
};

export default Footer;
