/**
 * @file RecentProblemsTable.jsx
 * @description A table displaying recent problem statements with a live search filter.
 */
import React, { useState } from 'react';
import { FiSearch } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { mockProblemStatements } from '../../mockData';

const RecentProblemsTable = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProblems = mockProblemStatements.filter((p) =>
    p.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Common click handler (future redirect)
  const handleClick = (id) => {
    console.log(`Clicked Problem ID: ${id}`);
    // 🧭 Future redirect will go here:
    // navigate(`/problem/${id}`);
  };

  return (
    <motion.div
      className="bg-white p-6 rounded-xl shadow-lg"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.8 }}
    >
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-brand-dark">Problem Statements</h2>
        <div className="relative w-full sm:w-64 mt-3 sm:mt-0">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-orange/50 focus:border-brand-orange"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="border-b-2 border-gray-200">
            <tr>
              <th className="py-3 pr-3 text-left text-xs font-semibold text-gray-500 uppercase">ID</th>
              <th className="py-3 pr-3 text-left text-xs font-semibold text-gray-500 uppercase">Title</th>
              <th className="py-3 pr-3 text-left text-xs font-semibold text-gray-500 uppercase">Evaluator ID</th>
              <th className="py-3 pr-3 text-left text-xs font-semibold text-gray-500 uppercase">Submissions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {filteredProblems.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                {/* ID clickable */}
                <td className="py-3 pr-3 text-sm font-mono text-brand-orange font-semibold">
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handleClick(p.id);
                    }}
                    className="hover:underline text-brand-orange"
                  >
                    {p.id}
                  </a>
                </td>

                {/* Title clickable */}
                <td className="py-3 pr-3 text-sm font-medium text-brand-dark">
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handleClick(p.id);
                    }}
                    className="hover:underline text-brand-dark"
                  >
                    {p.title}
                  </a>
                </td>

                {/* Evaluator ID clickable */}
                <td className="py-3 pr-3 text-sm text-gray-600 font-mono">
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handleClick(p.id);
                    }}
                    className="hover:underline text-gray-600"
                  >
                    {p.assignedEvaluators[0] || 'N/A'}
                  </a>
                </td>

                <td className="py-3 pr-3 text-sm font-semibold text-brand-orange">{p.submissions}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

export default RecentProblemsTable;
