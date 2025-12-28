import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiClipboard,
  FiUsers,
  FiCheckSquare,
  FiUpload,
  FiArrowRight
} from 'react-icons/fi';
import axios from 'axios';
import { URL } from '../../Utils';

import StatCard from '../../components/admin/StatCard';
import SubmissionsChart from '../../components/admin/SubmissionsChart';
import EvaluationChart from '../../components/admin/EvaluationChart';
import RecentProblemsTable from '../../components/admin/RecentProblemsTable';



const timeAgo = (dateParam) => {
  if (!dateParam) return '';
  const date = new Date(dateParam);
  const now = new Date();

  const seconds = Math.floor((now - date) / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
};



const AdminDashboard = () => {
  const [data, setData] = useState({
    problems: [],
    submissions: [],
    spocs: [],
    evaluators: []
  });

  const [recentActivities, setRecentActivities] = useState([]);



  const fetchProblems = async () => {
    try {
      const res = await axios.get(`${URL}/get_problems`);
      setData(prev => ({
        ...prev,
        problems: res.data?.problems || []
      }));
    } catch (err) {
   
    }
  };

  const fetchSubmissions = async () => {
    try {
      let allSubmissions = [];
      let page = 1;
      let totalPages = 1;
      const MAX_PAGES = 50;

      do {
        const res = await axios.get(`${URL}/submissions?page=${page}`);
        const result = res.data;
       

        if (!result?.submissions) break;

        const normalized = result.submissions.map(sub => ({
          ...sub,
          problemId: sub.PROBLEM_ID ?? sub.problem_id,
          subDate: sub.SUB_DATE ?? sub.sub_date,
          status: (sub.STATUS || '').toUpperCase()
        }));

        allSubmissions.push(...normalized);
        totalPages = result.totalPages || 1;
        page++;
      } while (page <= totalPages && page <= MAX_PAGES);

      setData(prev => ({ ...prev, submissions: allSubmissions }));
    } catch (err) {
      
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${URL}/get_all_users`, {
        withCredentials: true
      });

      const users = Array.isArray(res.data)
        ? res.data
        : res.data?.users || [];

      const normalize = u => ({
        ...u,
        role: (u.ROLE || u.role || '').toUpperCase(),
        date: u.DATE || u.date
      });

      const normalizedUsers = users.map(normalize);

      setData(prev => ({
        ...prev,
        spocs: normalizedUsers.filter(u => u.role === 'SPOC'),
        evaluators: normalizedUsers.filter(u => u.role === 'EVALUATOR')
      }));
    } catch (err) {
    
      setData(prev => ({ ...prev, spocs: [], evaluators: [] }));
    }
  };



  useEffect(() => {
    fetchProblems();
    fetchSubmissions();
    fetchUsers();
  }, []);

  useEffect(() => {
    const activities = [];

    data.submissions.slice(-20).forEach(sub => {
      if (sub.subDate) {
        activities.push({
          text: `New solution submitted for Problem ${sub.problemId}`,
          time: timeAgo(sub.subDate),
          icon: FiUpload,
          rawDate: new Date(sub.subDate)
        });
      }
    });

    [...data.spocs, ...data.evaluators].slice(-20).forEach(user => {
      if (user.date) {
        activities.push({
          text:
            user.role === 'SPOC'
              ? `SPOC ${user.NAME || user.name} joined the platform`
              : `Evaluator ${user.NAME || user.name} joined the platform`,
          time: timeAgo(user.date),
          icon: user.role === 'SPOC' ? FiUsers : FiCheckSquare,
          rawDate: new Date(user.date)
        });
      }
    });

    activities.sort((a, b) => b.rawDate - a.rawDate);
    setRecentActivities(activities.slice(0, 5));
  }, [data.submissions, data.spocs, data.evaluators]);



  const totalProblems = data.problems.length;
  const totalSubmissions = data.submissions.length;
  const pendingApprovals = data.spocs.filter(
    s => (s.STATUS || '').toUpperCase() === 'PENDING'
  ).length;

  const totalEvaluators = data.evaluators.length;

  const evaluatedCount = useMemo(
    () =>
      data.submissions.filter(s => s.status === 'EVALUATED').length,
    [data.submissions]
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      {/* Main */}
      <div className="lg:col-span-2 space-y-8">
        <h1 className="text-3xl font-bold text-brand-dark">
          Dashboard Overview
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <StatCard title="Total Problems" value={totalProblems} icon={FiClipboard} />
          <StatCard title="Total Submissions" value={totalSubmissions} icon={FiUpload} />
          <StatCard
            title="SPOC Pending"
            value={pendingApprovals}
            icon={FiCheckSquare}
            to="/admin/spoc-approvals"
          />
          <StatCard
            title="Total Evaluators"
            value={totalEvaluators}
            icon={FiUsers}
            to="/admin/evaluators"
          />
        </div>

        <SubmissionsChart submissions={data.submissions} />
        <RecentProblemsTable problems={data.problems} />
      </div>

      {/* Sidebar */}
      <motion.div
        className="lg:col-span-1 space-y-8"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-bold text-brand-dark mb-4">
            Quick Links
          </h2>
          <div className="space-y-3">
            <Link to="/admin/spoc-approvals" className="flex justify-between text-orange-400">
              Review SPOC Requests <FiArrowRight />
            </Link>
            <Link to="/admin/problem-statements/create" className="flex justify-between text-orange-400">
              Create Problem Statement <FiArrowRight />
            </Link>
            <Link to="/admin/evaluators" className="flex justify-between text-orange-400">
              Manage Evaluators <FiArrowRight />
            </Link>
          </div>
        </div>

        <EvaluationChart
          totalSubmissions={totalSubmissions}
          evaluatedCount={evaluatedCount}
        />

        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-bold text-brand-dark mb-4">
            Recent Activity
          </h2>

          {recentActivities.length ? (
            <ul className="space-y-4">
              {recentActivities.map((a, i) => {
                const Icon = a.icon;
                return (
                  <li key={i} className="flex items-start">
                    <div className="p-2 bg-gray-100 rounded-full mr-4">
                      <Icon className="w-5 h-5 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-sm text-brand-dark">{a.text}</p>
                      <p className="text-xs text-gray-400">{a.time}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-gray-400 italic">
              No recent activity found.
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default AdminDashboard;
