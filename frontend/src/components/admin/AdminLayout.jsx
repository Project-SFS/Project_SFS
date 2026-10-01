import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import axios from 'axios';
import { URL } from '../../Utils';
import { AdminContext } from './adminAccess';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';

const AdminLayout = () => {
  // State for the mobile slide-in menu
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  // State for the desktop hover-expandable menu
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  // the logged-in admin with their permissions, shared with every admin page
  const [access, setAccess] = useState({ user: null, loading: true });
  useEffect(() => {
    axios.get(`${URL}/cookie`, { withCredentials: true })
      .then((res) => setAccess({ user: res.data, loading: false }))
      .catch(() => setAccess({ user: null, loading: false }));
  }, []);

  return (
    <AdminContext.Provider value={access}>
    <div className="min-h-screen bg-gray-100">
      <AdminSidebar
        isMobileOpen={isMobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
        isExpanded={isSidebarExpanded}
        setIsExpanded={setIsSidebarExpanded}
      />

      {/* Main Content Area */}
      {/* THE FIX: Switched to full class names in the ternary for Tailwind JIT to work */}
      <div
        className={`transition-all duration-300 ease-in-out ${
          isSidebarExpanded ? 'lg:ml-64' : 'lg:ml-20'
        }`}
      >
        <AdminHeader setIsOpen={setMobileSidebarOpen} />
        <main className="p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* Overlay for mobile view */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
        />
      )}
    </div>
    </AdminContext.Provider>
  );
};

export default AdminLayout;