import React from 'react';
import { NavLink } from 'react-router-dom';
import { FiHome, FiFileText, FiUsers, FiCheckSquare, FiX, FiUserPlus, FiDownload, FiInbox, FiRefreshCw } from 'react-icons/fi';
import { useAdmin } from './adminAccess';
import yourLogo from '../../assets/image.png';

const NavItem = ({ to, icon, children, isExpanded, onClick }) => (
  <NavLink
    to={to}
    end={to === "/admin/users"}
    onClick={onClick}
    className={({ isActive }) =>
      `flex items-center h-12 text-gray-200 transition-colors duration-200 
       hover:text-primary-accent hover:bg-[#3b3b3b] ${
        isActive ? 'text-primary-accent font-semibold border-l-4 border-primary-accent bg-[#3b3b3b]' : ''
      }`
    }
  >
    <div className="w-20 h-full flex items-center justify-center flex-shrink-0">
      {icon}
    </div>
    <span
      className={`whitespace-nowrap transition-opacity duration-200 ${
        isExpanded ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {children}
    </span>
  </NavLink>
);

// sidebar entries; "permission" hides an entry from admins without it, "managersOnly" from admins who are
// neither the main admin nor have all three permissions
const NAV = [
  { to: "/admin/dashboard", label: "Dashboard", icon: FiHome },
  { to: "/admin/problems", label: "Challenges", icon: FiFileText },
  { to: "/admin/submissions", label: "Submissions", icon: FiInbox, permission: "EVALUATE" },
  { to: "/admin/users", label: "Users", icon: FiUsers, permission: "USERS" },
  { to: "/admin/users/create", label: "Create User", icon: FiUserPlus, permission: "USERS" },
  { to: "/admin/approvals", label: "Approvals", icon: FiCheckSquare, permission: "USERS" },
  { to: "/admin/exports", label: "Exports", icon: FiDownload },
  { to: "/admin/reset", label: "Reset portal", icon: FiRefreshCw, managersOnly: true },
];

const AdminSidebar = ({ isMobileOpen, setMobileOpen, isExpanded, setIsExpanded }) => {
  const { can, canManageAdmins } = useAdmin();
  const items = NAV.filter((item) => (!item.permission || can(item.permission)) && (!item.managersOnly || canManageAdmins));
  const closeMobileSidebar = () => setMobileOpen(false);

  return (
    <>
      {/* --- DESKTOP SIDEBAR --- */}
      <aside
        className={`hidden bg-[#4A4A4A] lg:fixed lg:inset-y-0 lg:z-20 lg:flex lg:flex-col transition-all duration-300 ease-in-out ${
          isExpanded ? 'w-64' : 'w-20'
        }`}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
      >
        {/* --- LOGO SECTION --- */}
        <div className="flex h-20 items-center justify-center flex-shrink-0 overflow-hidden border-b border-[#5A5A5A] px-4">
          <img
            src={yourLogo}
            alt="Solve for Sakthi Logo"
            className="w-full max-h-12 object-contain transition-all duration-300 brightness-110"
          />
        </div>

        <nav className="flex-grow mt-6">
          {items.map(({ to, label, icon: Icon }) => (
            <NavItem key={to} to={to} icon={<Icon size={20} />} isExpanded={isExpanded}>
              {label}
            </NavItem>
          ))}
        </nav>
      </aside>

      {/* --- MOBILE SIDEBAR --- */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#4A4A4A] transition-transform duration-300 ease-in-out lg:hidden ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-16 border-b border-[#5A5A5A] px-4">
          <span className="text-lg font-semibold text-white">Menu</span>
          <button onClick={closeMobileSidebar} className="p-2 text-gray-400 hover:text-primary-accent">
            <FiX size={24} />
          </button>
        </div>
        <nav className="flex-grow mt-6" onClick={closeMobileSidebar}>
          {items.map(({ to, label, icon: Icon }) => (
            <NavItem key={to} to={to} icon={<Icon size={20} />} isExpanded={true}>
              {label}
            </NavItem>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default AdminSidebar;
