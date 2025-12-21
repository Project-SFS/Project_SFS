import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Student_submitions from "../pages/student/Student_submitions";
import TeamDetails from "../pages/student/TeamDetails";
import ProblemStatements from "./ProblemStatements";
import axios from "axios"
import { URL } from "../Utils";

const StudentNav = () => {
  const [active, setActive] = useState("Problem Statements");
  const [userEmail, setEmail] = useState('');
  const [userSubmissions, setUserSubmissions] = useState([]);
  const tabs = ["Problem Statements", "My Submission", "Team Details"];

  const pageVariants = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -16 },
  };
  useEffect(() => {
    axios.get(`${URL}/cookie`, { withCredentials: true }).then(res => setEmail(res.data.EMAIL)
    )
  }, [])
  console.log(userEmail);

  useEffect(() => {
    if (userEmail != undefined)
      axios.post(`${URL}/get_submissions_by_email`, { userEmail }).then(res => setUserSubmissions(res.data))
  }, [userEmail])

  return (
    <div className="min-h-screen pt-20 bg-white/50 flex mt-4">
      {/* Center the whole workspace */}
      <main className="w-full max-w-6xl mx-auto px-6 md:px-8 pb-12">
        {/* Page header */}
        <motion.div
          className="mb-8 text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="inline-flex items-center rounded-full border border-[#fc9300]/40 bg-[#fff7ec] px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-[#fc9300] mb-3">
            Student Workspace
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
            Manage your journey at one place
          </h1>
          <p className="text-sm text-gray-600 mt-2 max-w-2xl mx-auto">
            Browse problem statements, track submissions, and view your team
            details in a single, focused interface.
          </p>
        </motion.div>

        {/* Tabs bar */}
        <div className="mb-8 flex justify-center">
          <div className="inline-flex bg-gray-100 border border-gray-200 rounded-full p-1 shadow-sm">
            {tabs.map((t) => {
              const isActive = active === t;
              return (
                <button
                  key={t}
                  onClick={() => setActive(t)}
                  className="relative px-5 sm:px-6 py-2 text-sm font-medium rounded-full transition-colors"
                >
                  {isActive && (
                    <motion.div
                      layoutId="active-pill"
                      className="absolute inset-0 rounded-full bg-[#fc9300] shadow-md"
                      transition={{
                        type: "spring",
                        stiffness: 340,
                        damping: 28,
                      }}
                    />
                  )}
                  <span
                    className={`relative z-10 ${
                      isActive ? "text-white" : "text-gray-700"
                    }`}
                  >
                    {t}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content area */}
        <div className="mt-2">
          <AnimatePresence mode="wait">
            {active === "Problem Statements" && (
              <motion.div
                key="problem-statements"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.25 }}
              >
                {/* ProblemStatements handles its own layout; header hidden here */}
                <ProblemStatements showHeader={false} />
              </motion.div>
            )}

            {active === "My Submission" && (
              <motion.div
                key="my-submission"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.25 }}
              >
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 sm:p-6 max-w-4xl mx-auto">
                  <div className="flex flex-col gap-1 mb-4 text-center sm:text-left">
                    <h2 className="text-lg font-semibold text-gray-900">
                      My Submissions
                    </h2>
                    <p className="text-sm text-gray-600">
                      Review the solutions you have submitted for various
                      problem statements.
                    </p>
                  </div>
                  <Student_submitions />
                </div>
              </motion.div>
            )}

            {active === "Team Details" && (
              <motion.div
                key="team-details"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.25 }}
              >
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 sm:p-6 max-w-4xl mx-auto">
                  <div className="flex flex-col gap-1 mb-4 text-center sm:text-left">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Team Details
                    </h2>
                    <p className="text-sm text-gray-600">
                      View your team members, their roles, and key information
                      for this submission.
                    </p>
                  </div>
                  <TeamDetails />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default StudentNav;
