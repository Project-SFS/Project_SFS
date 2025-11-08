/**
 * @file AdminDashboard.jsx
 * @description The main dashboard page for the admin panel, assembling all analytical components.
 *              This is the primary view for the admin, providing a comprehensive overview of platform activity.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiClipboard, FiUsers, FiCheckSquare, FiUpload, FiArrowRight, FiFilePlus } from 'react-icons/fi';

// Import all required components
import StatCard from '../../components/admin/StatCard';
import SubmissionsChart from '../../components/admin/SubmissionsChart';
import EvaluationChart from '../../components/admin/EvaluationChart';
import RecentProblemsTable from '../../components/admin/RecentProblemsTable';

// Mock data - Ensure these paths are correct for your project
import { mockProblemStatements, mockSubmissions, mockSpocRequests, mockUsers } from '../../mockData';

const AdminDashboard = () => {
  // --- Data Calculations ---
  const totalProblems = mockProblemStatements.length;
  const totalSubmissions = 340;
  const pendingApprovals = mockSpocRequests.filter(r => r.status === 'Pending').length;
  const totalEvaluators = mockUsers.length;
  // For the new donut chart, let's assume a number of evaluated submissions
  const evaluatedCount = 168;

  // Mock data for the activity log
  const recentActivities = [
    { text: 'Team "Innovators" submitted a solution.', time: '2h ago', icon: FiUpload },
    { text: 'SPOC request from PSG College approved.', time: '5h ago', icon: FiCheckSquare },
    { text: 'New problem "Optimize Logistics" was created.', time: '1d ago', icon: FiFilePlus },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      
      {/* --- Main Content Area (Left and Center Columns) --- */}
      <div className="lg:col-span-2 space-y-8">
        <h1 className="text-3xl font-bold text-brand-dark">Dashboard Overview</h1>

        {/* Top row: Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <StatCard title="Total Problems" value={totalProblems} icon={FiClipboard} delay={0.1} />
          <StatCard title="Total Submissions" value={totalSubmissions} icon={FiUpload} delay={0.2} />
          <StatCard title="SPOC Pending" value={pendingApprovals} icon={FiCheckSquare} delay={0.3} to="/admin/spoc-approvals" />
          <StatCard title="Total Evaluators" value={totalEvaluators} icon={FiUsers} delay={0.4} to="/admin/evaluators" />
        </div>

        {/* Second row: Submissions Graph */}
        <SubmissionsChart />

        {/* Third row: Recent Problems Table */}
        <RecentProblemsTable />
      </div>

      {/* --- Sidebar Area (Right Column) --- */}
      <motion.div 
        className="lg:col-span-1 space-y-8"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        {/* Quick Links Card */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-bold text-brand-dark mb-4">Quick Links</h2>
          <div className="space-y-3">
            <Link to="/admin/spoc-approvals" className="flex items-center justify-between text-orange-400 hover:text-orange-300"><span className="font-medium">Review SPOC Requests</span><FiArrowRight /></Link>
            <Link to="/admin/problem-statements/create" className="flex items-center justify-between text-orange-400 hover:text-orange-300"><span className="font-medium">create New Problem Statement</span><FiArrowRight /></Link>
            <Link to="/admin/evaluators" className="flex items-center justify-between text-orange-400 hover:text-orange-300"><span className="font-medium">Manage Evaluators</span><FiArrowRight /></Link>
             <Link to="/admin/evaluators" className="flex items-center justify-between text-orange-400 hover:text-orange-300"><span className="font-medium">Create new Evaluators</span><FiArrowRight /></Link>
              <Link to="/admin/evaluators" className="flex items-center justify-between text-orange-400 hover:text-orange-300"><span className="font-medium">View Problem statements</span><FiArrowRight /></Link>
          </div>
        </div>

        {/* Evaluation Status Card */}
        <EvaluationChart totalSubmissions={totalSubmissions} evaluatedCount={evaluatedCount} />
        
        {/* Recent Activity Log */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-bold text-brand-dark mb-4">Recent Activity</h2>
          <ul className="space-y-4">
            {recentActivities.map((activity, index) => (
              <li key={index} className="flex items-start">
                <div className="p-2 bg-gray-100 rounded-full mr-4"><activity.icon className="w-5 h-5 text-gray-500" /></div>
                <div>
                  <p className="text-sm text-brand-dark">{activity.text}</p>
                  <p className="text-xs text-gray-400">{activity.time}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminDashboard;