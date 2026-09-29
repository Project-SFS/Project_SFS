// src/components/admin/AdminNavbar.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUser, FiLogOut } from 'react-icons/fi';
import Button from '../common/button';

const AdminNavbar = () => {


  return (
    <header className="flex justify-between items-center p-4 bg-white shadow-md">
      <h2 className="text-2xl font-bold text-gray-800">
        Welcome, <span className="text-indigo-600">Admin!</span>
      </h2>
      <div className="flex items-center space-x-4">
        <div className="flex items-center text-gray-700">
          <FiUser className="w-5 h-5 mr-2" />
          <span className="font-medium">admin@sakthiauto.com</span>
        </div>
        <Button onClick={handleLogout} variant="secondary" size="sm">
          <FiLogOut className="inline-block w-4 h-4 mr-1" />
          Logout
        </Button>
      </div>
    </header>
  );
};

export default AdminNavbar;