/**
 * @file EvaluationChart.jsx
 * @description Renders a professional, minimalist chart panel to display key evaluation metrics.
 * @param {object} props - The component props.
 * @param {number} props.totalSubmissions - The total number of submissions.
 * @param {number} props.evaluatedCount - The number of submissions that have been evaluated.
 * @returns {JSX.Element} The rendered chart panel component.
 */

import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { motion } from 'framer-motion';

const EvaluationChart = ({ totalSubmissions, evaluatedCount }) => {
  // Ensure pendingCount is never negative
  const pendingCount = Math.max(0, totalSubmissions - evaluatedCount);

  /**
   * THE FIX (Data Order): We now put 'Evaluated' first.
   * This ensures the most important metric is drawn first.
   */
  const chartData = [
    { name: 'Evaluated', value: evaluatedCount },
    { name: 'Pending', value: pendingCount },
  ];

  /**
   * THE FIX (Color Order): The colors now correctly match the new data order.
   * - The first data item ('Evaluated') gets the first color (Blue).
   * - The second data item ('Pending') gets the second color (Gray).
   */
  const COLORS = ['#2563eb', '#d1d5db']; // Blue-600 for evaluated, Gray-300 for pending

  return (
    <motion.div
      className="bg-white p-8 rounded-2xl shadow-lg flex items-center justify-around w-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      {/* --- Left Section: Total Submissions --- */}
      <div className="text-center">
        <p className="text-lg text-gray-600">Total submissions</p>
        <p className="text-6xl font-bold text-gray-800 my-2">{totalSubmissions}</p>
        <div className="h-1.5 w-32 bg-blue-500 mx-auto rounded-full"></div>
      </div>

      {/* --- Center Section: Donut Chart --- */}
      <div className="relative w-64 h-64 flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius="60%"
              outerRadius="90%"
              paddingAngle={3}
              dataKey="value"
              stroke="none"
              isAnimationActive={true}
              animationDuration={900}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* --- Right Section: Evaluated Submissions --- */}
      <div className="text-center">
        <p className="text-5xl font-bold text-gray-800 mb-2">{evaluatedCount}</p>
        <p className="text-lg text-gray-600">Evaluated submissions</p>
      </div>
    </motion.div>
  );
};

export default EvaluationChart;