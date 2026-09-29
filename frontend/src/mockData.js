// src/mockData.js

export const mockUsers = [
  { id: 'u1', email: 'admin@sakthi.com', role: 'Admin', collegeId: null, teamName: null, phone: null },
  { id: 'u2', email: 'eval1@sakthi.com', role: 'Evaluator', collegeId: null, teamName: null, phone: '123-456-7890' },
  { id: 'u3', email: 'eval2@sakthi.com', role: 'Evaluator', collegeId: null, teamName: null, phone: '987-654-3210' },
  { id: 'u4', email: 'spoc1@collegea.edu', role: 'SPOC', collegeId: 'c1', teamName: null, phone: null },
  { id: 'u5', email: 'team1@collegea.edu', role: 'Team', collegeId: 'c1', teamName: 'Innovators', phone: null },
];

export const mockColleges = [
  { id: 'c1', name: 'College A', spocId: 'u4', status: 'Verified' },
  { id: 'c2', name: 'College B', spocId: 'u6', status: 'Pending' },
];

export const mockProblemStatements = [
  {
    id: 'p1',
    title: 'Optimizing CNC Machining Efficiency',
    description: 'Develop a machine learning model to predict and minimize tool wear...',
    theme: 'Ministry of Education',
    category: 'Software',
    youtube: '',
    dataset: '',
    deadline: new Date(Date.now() + 86400000 * 30).toISOString(),
    created: new Date(Date.now() - 86400000 * 10).toISOString(), // Added created date
    status: 'Open',
    assignedEvaluators: ['u2', 'u3'],
    submissions: 20,
  },
  {
    id: 'p2',
    title: 'Supply Chain Risk Assessment Dashboard',
    description: 'Create a web-based dashboard for visualizing and assessing material supplier risks.',
    theme: 'Ministry of Education',
    category: 'Data',
    youtube: '',
    dataset: '',
    deadline: new Date(Date.now() + 86400000 * 60).toISOString(),
    created: new Date(Date.now() - 86400000 * 5).toISOString(), // Added created date
    status: 'In Review',
    assignedEvaluators: ['u3'],
    submissions: 112,
  },
];

export const mockSpocRequests = [
  {
    id: 'req1',
    collegeName: 'College C',
    email: 'reqspoc@collegec.edu',
    dateRequested: new Date(Date.now() - 86400000 * 5).toISOString(),
    status: 'Pending',
  },
  {
    id: 'req2',
    collegeName: 'College D',
    email: 'reqspoc2@colleged.edu',
    dateRequested: new Date(Date.now() - 86400000 * 2).toISOString(),
    status: 'Pending',
  },
];

export const mockSubmissions = [
  {
    id: 's1',
    problemId: 'p1',
    teamId: 'u5',
    status: 'Submitted',
    spocId: 'SP001',
    title: 'Smart Community Health Monitoring and Early Warning System for Water-Borne Diseases in Rural Northeast India',
    teamName: 'Innovators',
    description: 'A comprehensive system for monitoring water quality and predicting disease outbreaks.',
    files: ['report.pdf', 'code.zip', 'presentation.pptx'],
    pdfUrl: '/sample.pdf',
    submittedDate: new Date(Date.now() - 86400000 * 2).toISOString(),
    marks: null,
    comments: '',
  },
  {
    id: 's2',
    problemId: 'p1',
    teamId: 'u8',
    status: 'Evaluated',
    spocId: 'SP002',
    title: 'Smart Community Health Monitoring and Early Warning System for Water-Borne Diseases in Rural Northeast India',
    teamName: 'Tech Wizards',
    description: 'IoT-based solution for real-time water quality monitoring and early warning alerts.',
    files: ['final_report.pdf', 'source_code.zip', 'demo_video.mp4'],
    pdfUrl: '/sample.pdf',
    submittedDate: new Date(Date.now() - 86400000 * 5).toISOString(),
    marks: 85,
    comments: 'Excellent IoT implementation with good sensor integration. Code quality is high but could improve documentation.',
  },
  {
    id: 's3',
    problemId: 'p2',
    teamId: 'u9',
    status: 'Evaluated',
    spocId: 'SP003',
    title: 'Supply Chain Risk Assessment Dashboard Implementation',
    teamName: 'Data Masters',
    description: 'Interactive dashboard for visualizing supply chain risks with predictive analytics.',
    files: ['dashboard_code.zip', 'documentation.pdf', 'screenshots.zip'],
    pdfUrl: '/sample.pdf',
    submittedDate: new Date(Date.now() - 86400000 * 3).toISOString(),
    marks: 92,
    comments: 'Outstanding data visualization and predictive analytics. Well-structured code and comprehensive documentation.',
  },
  {
    id: 's4',
    problemId: 'p1',
    teamId: 'u10',
    status: 'Submitted',
    spocId: 'SP004',
    title: 'Smart Community Health Monitoring and Early Warning System for Water-Borne Diseases in Rural Northeast India',
    teamName: 'Health Innovators',
    description: 'Machine learning approach to predict water-borne diseases using environmental data.',
    files: ['ml_model.zip', 'dataset.csv', 'analysis_report.pdf'],
    pdfUrl: '/sample.pdf',
    submittedDate: new Date(Date.now() - 86400000 * 1).toISOString(),
    marks: null,
    comments: '',
  },
  {
    id: 's5',
    problemId: 'p1',
    teamId: 'u11',
    status: 'Evaluated',
    spocId: 'SP005',
    title: 'Smart Community Health Monitoring and Early Warning System for Water-Borne Diseases in Rural Northeast India',
    teamName: 'Northeast Solutions',
    description: 'Community-focused health monitoring system tailored for rural Northeast India.',
    files: ['project_files.zip', 'final_presentation.pdf', 'code_repository.zip'],
    pdfUrl: '/sample.pdf',
    submittedDate: new Date(Date.now() - 86400000 * 7).toISOString(),
    marks: 78,
    comments: 'Good community-focused approach. Implementation is solid but could benefit from more detailed testing and validation.',
  },
];

export const getProblemStatementById = (id) =>
  mockProblemStatements.find((p) => p.id === id);

export const getEvaluatorUsers = () =>
  mockUsers.filter((u) => u.role === 'Evaluator');

export const getSpocRequests = () =>
    mockSpocRequests.filter((r) => r.status === 'Pending');

export const getSubmissionsByProblemId = (problemId) =>
  mockSubmissions.filter((s) => s.problemId === problemId);

export const getSubmissionById = (id) =>
  mockSubmissions.find((s) => s.id === id);

// Function to add a new problem statement
export const addProblemStatement = (newProblem) => {
  mockProblemStatements.push({
    ...newProblem,
    created: new Date().toISOString(), // Added created date
    deadline: new Date(Date.now() + 86400000 * 30).toISOString(), // Default deadline
    status: 'Open',
    assignedEvaluators: [],
    submissionsCount: 0,
  });
};
