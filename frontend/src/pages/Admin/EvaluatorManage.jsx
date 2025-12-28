/**
 * @file EvaluatorManage.jsx
 * @description A page for admins to manage evaluators, including adding, removing, and viewing evaluator details.
 */
// src/pages/admin/EvaluatorManage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Button from '../../components/common/button';
import { mockProblemStatements, getEvaluatorUsers } from '../../mockData';
import { FiSave, FiList } from 'react-icons/fi';

const EvaluatorManage = () => {
  const { id } = useParams(); // 'id' will be undefined for the '/create' route
  const navigate = useNavigate();
  const isCreate = !id;
  const existingEvaluator = id ? getEvaluatorUsers().find(e => e.id === id) : null;

  const [email, setEmail] = useState(existingEvaluator?.email || '');
  const [password, setPassword] = useState(''); // Only used for 'create'
  const [assignedProblems, setAssignedProblems] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (existingEvaluator) {
      // Mock: Get initially assigned problems for the evaluator
      const initialAssignments = mockProblemStatements
        .filter(p => p.assignedEvaluators.includes(id))
        .map(p => p.id);
      setAssignedProblems(initialAssignments);
    }
  }, [id, existingEvaluator]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // API logic for creating/updating
    if (isCreate) {
     
      // In a real app: POST to /api/users with role: 'Evaluator'
      alert(`Mock: Created new Evaluator ${email}.`);
    } else {
      
      // In a real app: PUT to /api/evaluators/:id/assignments
      alert(`Mock: Updated assignments for ${existingEvaluator.email}.`);
    }

    setIsSubmitting(false);
    navigate('/admin/evaluators'); // Go back to the list
  };

  const handleAssignmentChange = (problemId) => {
    setAssignedProblems(prev =>
      prev.includes(problemId)
        ? prev.filter(id => id !== problemId)
        : [...prev, problemId]
    );
  };

  if (id && !existingEvaluator) {
    return <div className="text-center py-10 text-red-600">Evaluator Not Found</div>;
  }

  return (
    <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-lg">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        {isCreate ? 'Create New Evaluator' : `Manage Evaluator: ${existingEvaluator.email}`}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <fieldset className="border p-4 rounded-lg space-y-4">
          <legend className="px-2 text-lg font-semibold text-indigo-600">{isCreate ? 'Account Details' : 'Account Info'}</legend>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={!isCreate} // Email is immutable after creation
              required
              className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-3 disabled:bg-gray-100 disabled:text-gray-500"
            />
          </div>
          {isCreate && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Password (Initial)</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-3"
              />
            </div>
          )}
        </fieldset>

        {!isCreate && (
          <fieldset className="border p-4 rounded-lg space-y-4">
            <legend className="px-2 text-lg font-semibold text-indigo-600">Problem Assignment</legend>
            <p className="text-sm text-gray-600">Select which Problem Statements this Evaluator is authorized to view submissions for and evaluate.</p>
            <div className="space-y-2 max-h-60 overflow-y-auto p-2 border rounded-lg">
              {mockProblemStatements.map(problem => (
                <div key={problem.id} className="flex items-center">
                  <input
                    id={`problem-${problem.id}`}
                    type="checkbox"
                    checked={assignedProblems.includes(problem.id)}
                    onChange={() => handleAssignmentChange(problem.id)}
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <label htmlFor={`problem-${problem.id}`} className="ml-3 text-sm font-medium text-gray-700">
                    {problem.title} <span className="text-xs text-gray-500">({problem.status})</span>
                  </label>
                </div>
              ))}
            </div>
          </fieldset>
        )}

        <div className="flex justify-end space-x-3">
          <Button variant="secondary" onClick={() => navigate('/admin/evaluators')} className="flex items-center">
            <FiList className="w-5 h-5 mr-1" /> Cancel/View List
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting} className="flex items-center">
            <FiSave className="w-5 h-5 mr-1" /> {isSubmitting ? 'Saving...' : (isCreate ? 'Create Account' : 'Save Assignments')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EvaluatorManage;
