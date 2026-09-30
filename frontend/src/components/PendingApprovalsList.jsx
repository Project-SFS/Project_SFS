import React from 'react';
import { FaUserCheck } from 'react-icons/fa';
import { mockSpocRequests } from '../mockData.js';

const ActivityListItem = ({ user, action, time }) => (
  <div className="flex items-center justify-between py-3">
    <div className="flex items-center">
      <div className="w-10 h-10 rounded-full bg-background-light flex items-center justify-center mr-4">
        <FaUserCheck className="w-5 h-5 text-text-secondary" />
      </div>
      <div>
        <p className="text-sm font-semibold text-text-primary">{user}</p>
        <p className="text-xs text-text-secondary">{action}</p>
      </div>
    </div>
    <p className="text-xs text-text-tertiary">{time}</p>
  </div>
);

const PendingApprovalsList = () => {
  const pendingSpocs = mockSpocRequests.filter(s => s.status === 'Pending');

  return (
    <div className="bg-background-white p-6 rounded-2xl shadow-card">
      <h3 className="text-lg font-semibold text-text-primary mb-4">Pending Approvals</h3>
      <div className="divide-y divide-border-color">
        {pendingSpocs.map(spoc => (
          <ActivityListItem key={spoc.id} user={spoc.name} action="Requested SPOC ID" time="2h ago" />
        ))}
        <div className="pt-4 text-center">
          <a href="/admin/approvals" className="text-sm font-medium text-action-blue hover:underline">
            View All Approvals
          </a>
        </div>
      </div>
    </div>
  );
};

export default PendingApprovalsList;