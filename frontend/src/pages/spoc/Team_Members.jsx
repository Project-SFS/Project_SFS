import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { URL } from "../../Utils";
import { HiArrowLeft } from "react-icons/hi";
import Header from "../../components/Header";

function Team_Members() {
  const params = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const ID = location?.state?.id;

  const [spoc_id, setspoc_id] = useState();
  const [FullTeam, setFullTeam] = useState([]);
  const [loading, setLoading] = useState(true);

  axios.defaults.withCredentials = true;

  useEffect(() => {
    // Fetch SPOC id
    axios.get(`${URL}/cookie`).then((res) => setspoc_id(res.data.ID));
  }, []);

  useEffect(() => {
    if (!ID) return;

    setLoading(true);
    axios
      .post(`${URL}/fetch_team_members`, { id: ID })
      .then((res) => {
        setFullTeam(res.data.result || []);
      })
      .catch((err) => {
       
        setFullTeam([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [ID]);

  return (
    <div className="min-h-screen bg-gray-50 py-10">
                <Header />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-20">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-100">
              <span className="h-2 w-2 rounded-full bg-[#fc8f00]" />
              <span className="text-xs font-semibold uppercase tracking-wide text-[#fc8f00]">
                Team Overview
              </span>
            </div>
            <h1 className="mt-3 text-2xl sm:text-3xl font-bold text-gray-900">
              Team Members
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              View the member details of the selected team, including roles and contact
              information.
            </p>
          </div>

          <button
            onClick={() => navigate("/spoc")}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <HiArrowLeft className="text-gray-500" />
            Back to Teams
          </button>
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 px-4 sm:px-6 py-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base sm:text-lg font-semibold text-gray-800">
              Team Details
            </h2>
            {FullTeam.length > 0 && (
              <span className="text-xs sm:text-sm text-gray-500">
                Total Members:{" "}
                <span className="font-semibold text-gray-700">
                  {FullTeam.length}
                </span>
              </span>
            )}
          </div>

          {loading ? (
            <div className="rounded bg-white p-8 text-center">
              <svg
                className="mx-auto h-8 w-8 animate-spin text-[#0f62fe]"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
              <div className="mt-3 text-sm text-[#4a4a4a]">
                Loading team details...
              </div>
            </div>
          ) : FullTeam.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-left text-[11px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-[11px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-[11px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-[11px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-[11px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Gender
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {FullTeam.map((m, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 sm:px-6 py-3 text-gray-700 whitespace-nowrap">
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-800">
                          {m.ROLE}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-3 text-gray-900 whitespace-nowrap">
                        {m.NAME}
                      </td>
                      <td className="px-4 sm:px-6 py-3 text-gray-600 whitespace-nowrap">
                        {m.EMAIL}
                      </td>
                      <td className="px-4 sm:px-6 py-3 text-gray-600 whitespace-nowrap">
                        {m.PHONE}
                      </td>
                      <td className="px-4 sm:px-6 py-3 text-gray-600 whitespace-nowrap">
                        {m.GENDER}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-10 text-center text-sm text-gray-600">
              No members found for this team.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Team_Members;
