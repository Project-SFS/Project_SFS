import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { HiMenuAlt3, HiX, HiUser, HiLogout, HiHome } from 'react-icons/hi';
import axios from 'axios';
import sakthiLogo from '../assets/sakthi_auto.png';
import profileIcon from '../assets/profile.png';
import { auth, URL } from '../Utils';

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [userName, setUserName] = useState(null);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const authData = await auth();
      if (authData) {
        setUserRole(authData.role);
        setUserName(authData.name);
      }
    };
    checkAuth();
  }, []);

  const handleLogout = async () => {
    try {
      await axios.get(`${URL}/logout`, { withCredentials: true });
      setUserRole(null);
      setIsProfileDropdownOpen(false);
      navigate('/');
    } catch (error) {

    }
  };

  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'About us', path: '/about' },
    { name: "Problem Statement", path: "/problemstatements" },
  ];

  // A reusable NavLink component for both mobile and desktop
  const NavItem = ({ path, name }) => (
    <li>
      <NavLink
        to={path}
        onClick={() => setIsMobileMenuOpen(false)}
        className={({ isActive }) =>
          `block px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200 ease-in-out transform hover:scale-105 ${isActive
            ? 'bg-black/20 text-orange-400'
            : 'text-slate-200 hover:text-orange-400'
          }`
        }
      >
        {name}
      </NavLink>
    </li>
  );

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-[#494949] text-white border-b border-white/10 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">

          {/* Left Section: Logo */}
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center">
              <img className="w-32 h-14 object-contain" src={sakthiLogo} alt="Sakthi Auto Logo" />
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

          {/* Right Section: Profile and Mobile Toggle */}
          <div className="flex items-center space-x-3">
            {/* Desktop: Separate Login and Register Buttons */}
            {userRole ? (
              // ... (Profile dropdown logic remains same)
              <div className="flex items-center">
                {/* ... existing profile content ... */}
                {userName && (
                  <span className="hidden lg:block text-sm font-medium text-gray-300 mr-4">
                    {userName}
                  </span>
                )}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                    className="hidden md:block rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#494949] focus:ring-orange-400"
                    aria-label="User Menu"
                  >
                    <img className="h-10 w-10 rounded-full ring-2 ring-white/20 hover:ring-orange-400/80 transition-shadow" src={profileIcon} alt="User Profile" />
                  </button>

                  {/* Dropdown Menu */}
                  {isProfileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-xl shadow-lg bg-white ring-1 ring-black/5 z-50 transform opacity-100 scale-100 transition-all duration-200">
                      <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                        <div className="px-4 py-3 border-b border-gray-100">
                          <p className="text-sm text-gray-500">Signed in as</p>
                          <p className="text-sm font-semibold text-gray-900 truncate">{userRole}</p>
                        </div>

                        {(() => {
                          const dashboardPaths = {
                            STUDENT: '/student',
                            SPOC: '/spoc',
                            ADMIN: '/admin',
                            EVALUATOR: '/evaluator'
                          };

                          const dashboardLabels = {
                            STUDENT: 'Student Dashboard',
                            SPOC: 'SPOC Dashboard',
                            ADMIN: 'Admin Panel',
                            EVALUATOR: 'Evaluator Panel'
                          };

                          const dashboardPath = dashboardPaths[userRole] || '/profile';
                          const label = dashboardLabels[userRole] || 'Dashboard';
                          const isOnDashboard = location.pathname.startsWith(dashboardPath);

                          return (
                            <Link
                              to={isOnDashboard ? '/' : dashboardPath}
                              className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                              onClick={() => setIsProfileDropdownOpen(false)}
                            >
                              {isOnDashboard ? (
                                <>
                                  <HiHome className="mr-3 h-5 w-5 text-gray-400 group-hover:text-orange-500" />
                                  Go to Home
                                </>
                              ) : (
                                <>
                                  <HiUser className="mr-3 h-5 w-5 text-gray-400 group-hover:text-orange-500" />
                                  Go to {label}
                                </>
                              )}
                            </Link>
                          );
                        })()}

                        <button
                          onClick={handleLogout}
                          className="flex w-full items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <HiLogout className="mr-3 h-5 w-5 text-red-400 group-hover:text-red-500" />
                          Sign out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-3">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-white hover:text-orange-400 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#FF9900] hover:bg-[#e68900] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-[#FF9900] transition-all"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-slate-300 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-400"
                aria-controls="mobile-menu"
                aria-expanded={isMobileMenuOpen}
              >
                <span className="sr-only">Open main menu</span>
                {isMobileMenuOpen ? <HiX className="block h-6 w-6" /> : <HiMenuAlt3 className="block h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* --- Mobile Menu --- */}
      <div
        className={`md:hidden bg-[#494949] overflow-hidden transition-all duration-300 ease-in-out ${isMobileMenuOpen ? 'max-h-96' : 'max-h-0'}`}
        id="mobile-menu"
      >
        <ul className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          {navItems.map((item) => (
            <NavItem key={`${item.name}-mobile`} {...item} />
          ))}
          <li>
            {userRole ? (
              <Link
                to={
                  userRole === 'STUDENT' ? '/student' :
                    userRole === 'SPOC' ? '/spoc' :
                      userRole === 'ADMIN' ? '/admin' :
                        userRole === 'EVALUATOR' ? '/evaluator' : '/profile'
                }
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center mt-2 px-3 py-2 rounded-md text-base font-medium text-slate-200 hover:bg-black/20 hover:text-orange-400"
              >
                <img className="h-8 w-8 rounded-full object-cover mr-3" src={profileIcon} alt="User Profile" />
                <span>Profile</span>
              </Link>
            ) : (
              <div className="space-y-1 mt-2">
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-slate-200 hover:bg-black/20 hover:text-orange-400"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-[#FF9900] hover:bg-black/20"
                >
                  Sign Up
                </Link>
              </div>
            )}

          </li>
        </ul>
      </div>
    </header>
  );
};

export default Header;