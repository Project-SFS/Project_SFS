import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { URL } from "../../Utils";
import Button from "../../components/common/button";

const EvaluatorProblemDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [problem, setProblem] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProblem = async () => {
            try {
                const res = await axios.get(`${URL}/problems/${id}`);
                if (res.data?.problems?.length > 0) {
                    setProblem(res.data.problems[0]);
                }
            } catch (err) {
               
            } finally {
                setLoading(false);
            }
        };
        fetchProblem();
    }, [id]);

    if (loading) return <div className="p-10 text-center">Loading...</div>;
    if (!problem) return <div className="p-10 text-center">Problem not found</div>;

    return (
        <div className="min-h-screen bg-[#ffffff] flex flex-col items-center py-10 px-6">
            <div className="w-full md:w-4/5 lg:w-2/3 flex justify-start mb-4">
                <Button onClick={() => navigate(-1)} variant="secondary">Back</Button>
            </div>

            {/* Header */}
            <h1 className="text-4xl font-bold text-[#4a4a4a] mb-10 text-center">
                Problem Details
            </h1>

            {/* Container */}
            <div className="w-full md:w-4/5 lg:w-2/3 bg-[#f9f9f9] shadow-xl border border-gray-200 rounded-2xl p-8 space-y-8">

                {/* Problem Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-300 pb-4">
                    <div>
                        <h2 className="text-2xl font-bold text-[#4a4a4a]">
                            {problem.TITLE}
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">{problem.DEPT}</p>
                    </div>
                    <div className="bg-[#fc8f00] text-white text-sm font-semibold px-4 py-2 rounded-lg mt-3 md:mt-0">
                        <b>Problem ID: {problem.ID}</b>
                    </div>
                </div>

                {/* Metadata Section */}
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div className="flex flex-col">
                        <span className="text-sm text-gray-500">Department</span>
                        <span className="text-[#4a4a4a] font-medium">{problem.DEPT}</span>
                    </div>
                    {/* Removed Deadline/Assigned Date if not in DB schema explicitly or add if needed */}
                </div>

                {/* Problem Description */}
                <div>
                    <h3 className="text-xl font-semibold text-[#4a4a4a] mb-3">
                        Problem Description
                    </h3>
                    <div className="bg-white border border-gray-200 rounded-lg p-5 text-gray-700 leading-relaxed shadow-sm hover:shadow-md transition text-justify whitespace-pre-wrap">
                        {problem.DESCRIPTION}
                    </div>
                </div>

                {/* Reference Links */}
                {problem.Reference && (
                    <div>
                        <h3 className="text-xl font-semibold text-[#4a4a4a] mb-3">
                            Reference Links
                        </h3>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>
                                <a
                                    href={problem.Reference}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[#fc8f00] hover:underline"
                                >
                                    {problem.Reference}
                                </a>
                            </li>
                        </ul>
                    </div>
                )}

            </div>
        </div>
    );
};

export default EvaluatorProblemDetail;
