// src/mockData.js
import samplePdf from './assets/sample.pdf';

export const mockUsers = [
  { id: 'u1', email: 'admin@sakthi.com', role: 'Admin', collegeId: null, teamName: null, phone: null },
  { id: 'u2', email: 'eval1@sakthi.com', role: 'Evaluator', collegeId: null, teamName: null, phone: '123-456-7890' },
  { id: 'u3', email: 'eval2@sakthi.com', role: 'Evaluator', collegeId: null, teamName: null, phone: '987-654-3210' },
  { id: 'u4', email: 'spoc1@collegea.edu', role: 'SPOC', collegeId: 'c1', teamName: null, phone: null },
  { id: 'u5', email: 'team1@collegea.edu', role: 'Team', collegeId: 'c1', teamName: 'Innovators', phone: null },
  { id: 'u16', email: 'spoc2@collegeb.edu', role: 'SPOC', collegeId: 'c2', teamName: null, phone: '555-0106' },
  { id: 'u17', email: 'spoc3@collegec.edu', role: 'SPOC', collegeId: 'c3', teamName: null, phone: '555-0107' },
  ...Array.from({ length: 10 }, (_, index) => ({
    id: `u${index + 6}`,
    email: `student${index + 1}@college${index % 3 + 1}.edu`,
    role: 'Student',
    collegeId: `c${index % 3 + 1}`,
    teamName: `Student Team ${index + 1}`,
    phone: `555-01${String(index + 10).slice(-2)}`,
  })),
];

export const mockColleges = [
  { id: 'c1', name: 'College A', spocId: 'u4', status: 'Verified' },
  { id: 'c2', name: 'College B', spocId: 'u16', status: 'Verified' },
  { id: 'c3', name: 'College C', spocId: 'u17', status: 'Pending' },
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
  {
    id: 'p3',
    title: 'AI-Powered Crop Disease Detection',
    description: 'Build a mobile-friendly image classification service that helps farmers identify common crop diseases and receive practical treatment guidance.',
    theme: 'Agriculture and Rural Development',
    category: 'Software',
    youtube: '',
    dataset: '',
    deadline: new Date(Date.now() + 86400000 * 45).toISOString(),
    created: new Date(Date.now() - 86400000 * 4).toISOString(),
    status: 'Open',
    assignedEvaluators: ['u2'],
    submissions: 8,
  },
  {
    id: 'p4',
    title: 'Smart Campus Energy Monitoring',
    description: 'Design an IoT-based system to monitor building energy use, identify waste, and recommend ways to reduce campus electricity consumption.',
    theme: 'Smart Education',
    category: 'Hardware',
    youtube: '',
    dataset: '',
    deadline: new Date(Date.now() + 86400000 * 35).toISOString(),
    created: new Date(Date.now() - 86400000 * 3).toISOString(),
    status: 'Open',
    assignedEvaluators: ['u3'],
    submissions: 14,
  },
  {
    id: 'p5',
    title: 'Accessible Learning Content Platform',
    description: 'Create a learning platform that converts course materials into accessible formats for students with visual, hearing, and reading accessibility needs.',
    theme: 'Inclusive Education',
    category: 'Software',
    youtube: '',
    dataset: '',
    deadline: new Date(Date.now() + 86400000 * 50).toISOString(),
    created: new Date(Date.now() - 86400000 * 8).toISOString(),
    status: 'Open',
    assignedEvaluators: ['u2', 'u3'],
    submissions: 31,
  },
  {
    id: 'p6',
    title: 'Public Transport Route Optimizer',
    description: 'Use ridership and traffic data to recommend efficient public transport routes and schedules for growing urban and suburban communities.',
    theme: 'Urban Mobility',
    category: 'Data',
    youtube: '',
    dataset: '',
    deadline: new Date(Date.now() + 86400000 * 28).toISOString(),
    created: new Date(Date.now() - 86400000 * 6).toISOString(),
    status: 'In Review',
    assignedEvaluators: ['u3'],
    submissions: 19,
  },
  {
    id: 'p7',
    title: 'Community Water Quality Sensor',
    description: 'Prototype a low-cost water quality monitoring device with clear alerts and a dashboard for local communities and public health teams.',
    theme: 'Clean Water and Sanitation',
    category: 'Hardware',
    youtube: '',
    dataset: '',
    deadline: new Date(Date.now() + 86400000 * 40).toISOString(),
    created: new Date(Date.now() - 86400000 * 9).toISOString(),
    status: 'Open',
    assignedEvaluators: ['u2'],
    submissions: 11,
  },
  {
    id: 'p8',
    title: 'Local Language Citizen Services Assistant',
    description: 'Develop a multilingual assistant that helps residents discover public services, understand eligibility, and prepare required application documents.',
    theme: 'Digital Public Services',
    category: 'Software',
    youtube: '',
    dataset: '',
    deadline: new Date(Date.now() + 86400000 * 55).toISOString(),
    created: new Date(Date.now() - 86400000 * 2).toISOString(),
    status: 'Open',
    assignedEvaluators: ['u2', 'u3'],
    submissions: 26,
  },
  {
    id: 'p9',
    title: 'Food Waste Tracking for Institutional Kitchens',
    description: 'Build a simple tracking and analytics solution that measures food waste and helps institutional kitchens improve purchasing and meal planning.',
    theme: 'Sustainable Communities',
    category: 'Data',
    youtube: '',
    dataset: '',
    deadline: new Date(Date.now() + 86400000 * 32).toISOString(),
    created: new Date(Date.now() - 86400000 * 7).toISOString(),
    status: 'In Review',
    assignedEvaluators: ['u3'],
    submissions: 17,
  },
  {
    id: 'p10',
    title: 'Emergency Resource Coordination Dashboard',
    description: 'Create a real-time dashboard to coordinate emergency supplies, shelters, and volunteer teams during local disaster response.',
    theme: 'Disaster Resilience',
    category: 'Software',
    youtube: '',
    dataset: '',
    deadline: new Date(Date.now() + 86400000 * 25).toISOString(),
    created: new Date(Date.now() - 86400000 * 1).toISOString(),
    status: 'Open',
    assignedEvaluators: ['u2'],
    submissions: 6,
  },
];

export const mockStudents = mockUsers.filter((user) => user.role === 'Student');

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
    pdfUrl: samplePdf,
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
    pdfUrl: samplePdf,
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
    pdfUrl: samplePdf,
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
    pdfUrl: samplePdf,
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
    pdfUrl: samplePdf,
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
  const nextId = Math.max(0, ...mockProblemStatements.map((problem) => Number(problem.id.slice(1)) || 0)) + 1;
  mockProblemStatements.push({
    id: `p${nextId}`,
    ...newProblem,
    created: newProblem.created || new Date().toISOString(),
    deadline: newProblem.deadline || new Date(Date.now() + 86400000 * 30).toISOString(),
    status: newProblem.status || 'Open',
    assignedEvaluators: newProblem.assignedEvaluators || [],
    submissions: newProblem.submissions || 0,
  });
};
