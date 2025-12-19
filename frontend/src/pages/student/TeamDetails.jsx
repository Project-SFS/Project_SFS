import axios from "axios";
import  { useEffect, useState } from "react";
import { URL } from "../../Utils";

const TeamIcon = () => (
  <svg className="w-8 h-8 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const UserIcon = () => (
  <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
    <path
      fillRule="evenodd"
      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
      clipRule="evenodd"
    />
  </svg>
);

const IdIcon = () => (
  <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
    <path
      fillRule="evenodd"
      d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
      clipRule="evenodd"
    />
  </svg>
);

const CollegeIcon = () => (
  <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
    <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.84L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.84l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
  </svg>
);

const MentorIcon = () => (
  <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
    <path
      fillRule="evenodd"
      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z"
      clipRule="evenodd"
    />
  </svg>
);

const EmailIcon = () => (
  <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
  </svg>
);

const PhoneIcon = () => (
  <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
  </svg>
);

const GenderIcon = () => (
  <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
    <path
      fillRule="evenodd"
      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
      clipRule="evenodd"
    />
  </svg>
);


const TeamDetails = () => {
  const [Team_data1, setTeam_data1] = useState([]);
  const [Team_data2, setTeam_data2] = useState({});
  const [Team_id, setTeam_id] = useState(null);
  const [Lead_data, setLead_data] = useState(null);

  useEffect(() => {
    axios
      .get(`${URL}/cookie`, { withCredentials: true })
      .then((res) => {
        setLead_data(res.data);
        axios.post(`${URL}/fetch_team_id_email`, { email: res.data.EMAIL })
      .then((res) => {
        if (res.data?.[0]?.ID) setTeam_id(res.data[0].ID);
      })
      .catch(console.error)
  })
  }, []);

  useEffect(() => {
    if (!Team_id) return;

    axios
      .post(`${URL}/fetch_team_members`, { id: Team_id })
      .then((res) => setTeam_data1(res.data))
      .catch(console.error);

    axios
      .post(`${URL}/fetch_team_for_students`, { id: Team_id })
      .then((res) => setTeam_data2(res.data[0] || {}))
      .catch(console.error);
  }, [Team_id]);

  const team_leader = Team_data1?.result?.[0]?.NAME;
  const members = Team_data1?.result || [];
  const college = Lead_data?.COLLEGE

  // console.log(Spoc);
  
  const metaDetails = [
    { label: "Team Name", value: Team_data2?.NAME, icon: <TeamIcon /> },
    { label: "Team Leader", value: team_leader, icon: <UserIcon /> },
    { label: "Team ID", value: "TID_" + (Team_data2?.ID || ""), icon: <IdIcon /> },
    { label: "College", value: college , icon: <CollegeIcon /> },
    { label: "Mentor", value: Team_data2?.MENTOR_NAME, icon: <MentorIcon /> },
  ];

  return (
    <div className="min-h-screen bg-white/50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

          <section className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Team Information</h2>

            <div className="space-y-4">
              {metaDetails.map((item, idx) => (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4
                             bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-100"
                >
                  <div className="flex items-center gap-3">{item.icon}
                    <span className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                      {item.label}
                    </span>
                  </div>

                  <span className="text-base sm:text-lg font-semibold text-gray-800">
                    {item.value || "—"}
                  </span>
                </div>
              ))}
            </div>
          </section>
          <section className="bg-white rounded-xl shadow-lg p-6 sm:p-8 mt-1">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Member Overview</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 ">
              {members.map((m) => (
                <div
                  key={m.ID}
                  className="backdrop-blur-xl bg-white/70 border border-gray-200 rounded-xl shadow-lg 
                             hover:shadow-2xl transition-all duration-300 p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-orange-400 text-white flex items-center justify-center text-lg font-bold">
                      {m.NAME?.[0]}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900">{m.NAME}</p>
                      <p className="text-sm text-gray-600">{m.ROLE}</p>
                    </div>
                  </div>

                  <div className="mt-3 space-y-2 text-xs text-gray-700">
                    <div className="flex items-center gap-2"><EmailIcon /><span>{m.EMAIL}</span></div>
                    <div className="flex items-center gap-2"><PhoneIcon /><span>{m.PHONE}</span></div>
                    <div className="flex items-center gap-2"><GenderIcon /><span>{m.GENDER}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default TeamDetails;