/**
 * @file SubmissionsChart.jsx
 * @description A chart component with time-range filtering to display submission trends.
 * @requires recharts, framer-motion
 */

import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, AreaChart, XAxis, YAxis, Tooltip, Area } from 'recharts';
import { motion } from 'framer-motion';

// Mock data spanning several months for realistic filtering
const allSubmissionsData = Array.from({ length: 120 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - i);
  return {
    date,
    submissions: Math.floor(Math.random() * (15 - 2 + 1)) + 2,
  };
}).reverse();

/**
 * A reusable button for selecting a time range.
 */
const TimeRangeButton = ({ range, activeRange, setRange }) => (
  <button
    onClick={() => setRange(range)}
    className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
      activeRange === range ? 'bg-gray-200 text-black' : 'text-gray-600 hover:bg-gray-200'
    }`}
  >
    {range}
  </button>
);

const SubmissionsChart = () => {
  const [timeRange, setTimeRange] = useState('30 Days');
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const now = new Date();
    let filteredData;

    if (timeRange === 'Monthly') {
      const monthlyAgg = allSubmissionsData.reduce((acc, { date, submissions }) => {
        const month = date.toLocaleDateString('en-US', { year: '2-digit', month: 'short' });
        acc[month] = (acc[month] || 0) + submissions;
        return acc;
      }, {});
      filteredData = Object.keys(monthlyAgg).map(month => ({ date: month, submissions: monthlyAgg[month] }));
    } else {
      const days = timeRange === '7 Days' ? 7 : 30;
      const cutoff = new Date(now.setDate(now.getDate() - days));
      filteredData = allSubmissionsData
        .filter(d => d.date > cutoff)
        .map(d => ({ ...d, date: d.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }));
    }
    setChartData(filteredData);
  }, [timeRange]);

  return (
    <motion.div
      className="bg-white p-6 rounded-xl shadow-lg"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-brand-dark">Submissions Over Time</h2>
        <div className="flex items-center space-x-2 p-1 bg-gray-50 rounded-lg mt-3 sm:mt-0">
          <TimeRangeButton range="7 Days" activeRange={timeRange} setRange={setTimeRange} />
          <TimeRangeButton range="30 Days" activeRange={timeRange} setRange={setTimeRange} />
          <TimeRangeButton range="Monthly" activeRange={timeRange} setRange={setTimeRange} />
        </div>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorSubmissions" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ff9100" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#ff9100" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '0.75rem' }} />
            <Area type="monotone" dataKey="submissions" stroke="#ff9100" strokeWidth={2} fill="url(#colorSubmissions)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export default SubmissionsChart;