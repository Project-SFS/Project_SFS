import React, { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { HiMenuAlt3, HiX } from "react-icons/hi";
import AdminProfilePopup from "../components/AdminProfilePopup.jsx";


// Import your assets
import sakthiLogo from "../assets/sakthi_auto.png";
import profileIcon from "../assets/profile.png";

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false); // control popup visibility

  const navItems = [
    { name: "Home", path: "/" },
    { name: "Problem Statement", path: "/student" },
    { name: "About us", path: "/about" },
    { name: "FAQ", path: "/faq" },
  ];

  const NavItem = ({ path, name }) => (
    <li>
      <NavLink
        to={path}
        onClick={() => setIsMobileMenuOpen(false)}
        className={({ isActive }) =>
          `block px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200 ease-in-out transform hover:scale-105 ${
            isActive
              ? "bg-black/20 text-orange-400"
              : "text-slate-200 hover:text-orange-400"
          }`
        }
      >
        {name}
      </NavLink>
    </li>
  );

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 bg-[#494949] text-white border-b border-white/10 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Left Section: Logo */}
            <div className="flex-shrink-0">
              <Link to="/" className="flex items-center">
                <img
                  className="w-32 h-14 object-contain"
                  src={sakthiLogo}
                  alt="Sakthi Auto Logo"
                />
              </Link>
            </div>

            {/* Center Section: Desktop Navigation */}
            <nav className="hidden md:flex md:justify-center">
              <ul className="flex items-center space-x-2">
                {navItems.map((item) => (
                  <NavItem key={item.name} {...item} />
                ))}
              </ul>
            </nav>

            {/* Right Section: Profile & Mobile Menu */}
            <div className="flex items-center space-x-3">
              {/* Profile Icon Button */}
              <button
                onClick={() => setShowProfile(true)}
                className="hidden md:block rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#494949] focus:ring-orange-400"
                aria-label="View Profile"
              >
                <img
                  className="h-10 w-10 rounded-full ring-2 ring-white/20 hover:ring-orange-400/80 transition-shadow"
                  src={profileIcon}
                  alt="User Profile"
                />
              </button>

              {/* Mobile Menu Toggle */}
              <div className="md:hidden">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="inline-flex items-center justify-center p-2 rounded-md text-slate-300 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-400"
                  aria-controls="mobile-menu"
                  aria-expanded={isMobileMenuOpen}
                >
                  <span className="sr-only">Open main menu</span>
                  {isMobileMenuOpen ? (
                    <HiX className="block h-6 w-6" />
                  ) : (
                    <HiMenuAlt3 className="block h-6 w-6" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* --- Mobile Menu --- */}
        <div
          className={`md:hidden bg-[#494949] overflow-hidden transition-all duration-300 ease-in-out ${
            isMobileMenuOpen ? "max-h-96" : "max-h-0"
          }`}
          id="mobile-menu"
        >
          <ul className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navItems.map((item) => (
              <NavItem key={`${item.name}-mobile`} {...item} />
            ))}
            <li>
              <button
                onClick={() => {
                  setShowProfile(true);
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center mt-2 px-3 py-2 rounded-md text-base font-medium text-slate-200 hover:bg-black/20 hover:text-orange-400 w-full"
              >
                <img
                  className="h-8 w-8 rounded-full object-cover mr-3"
                  src={profileIcon}
                  alt="User Profile"
                />
                <span>Profile</span>
              </button>
            </li>
          </ul>
        </div>
      </header>

      {/* Profile Popup Component */}
      <AdminProfilePopup
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
      />
    </>
  );
};

export default Header;
