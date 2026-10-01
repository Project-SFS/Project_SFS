/**
 * @file ProblemStatementEdit.jsx
 * @description Admin edits an existing problem statement (all fields, including the deadline).
 */
import { useParams } from 'react-router-dom';
import ProblemStatementForm from './ProblemStatementForm';

const ProblemStatementEdit = () => {
  const { id } = useParams();
  return <ProblemStatementForm editId={id} />;
};

export default ProblemStatementEdit;
