import React, { useEffect, useState } from "react";
import { motion } from "framer-motion"; // 👈 Added Framer Motion
import axios from "axios";
import {URL} from "../../Utils";
import toast, { Toaster } from "react-hot-toast";

const SPOCProfile = () => {
  const [profilePic, setProfilePic] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    designation: "",
    phone: "",
    college: "Knowledge Institute of Technology",
    email: "sample@kiot.ac.in",
  });
  const [data, setdata] = useState([])

  useEffect(() => {
    axios.defaults.withCredentials = true;
    axios.get(`${URL}/cookie`).then(res => {
    
      
      if (res.data.message == 'jwt must be provided') {
        toast.error("Please login")
      }
      setdata(res.data)
    })
  },[])

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePic(URL.createObjectURL(file));
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };



  // ✨ Animation variants (same style as dashboard)
  const pageVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.5, delay: 0.2 } },
  };

  return (
    <motion.div
      className="w-full flex justify-center px-4 mt-10 mb-10"
      variants={pageVariants}
      initial="hidden"
      animate="visible"
    >
      <Toaster position="top-right" />

      <motion.div className="max-w-4xl w-full" variants={cardVariants}>
        {/* Header */}
        <header className="mb-6 text-center">
          <motion.h1
            className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#fc8f00] to-[#ffb347]"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            SPOC Profile
          </motion.h1>
          <motion.p
            className="text-sm text-gray-500 mt-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Keep your information up to date so students can reach you easily.
          </motion.p>
        </header>

        {/* Profile Card */}
        <motion.div
          className="bg-white border border-gray-100 rounded-2xl shadow-xl p-6 md:p-8 flex flex-col md:flex-row gap-8 items-start"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {/* Left: Profile Picture */}
          <motion.div
            className="flex-shrink-0 w-full md:w-40 flex flex-col items-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div className="relative rounded-full w-40 h-40 p-1 bg-gradient-to-br from-[#ffedd5] via-[#ffe4c4] to-[#fff2e6]">
              <div className="h-full w-full rounded-full overflow-hidden bg-gray-50 flex items-center justify-center border border-gray-100 shadow-sm">
                {profilePic ? (
                  <motion.img
                    src={profilePic}
                    alt="Profile"
                    className="h-full w-full object-cover"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4 }}
                  />
                ) : (
                  <motion.div
                    className="flex flex-col items-center justify-center text-gray-400"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4 }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-10 w-10 mb-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="text-sm">Upload Photo</span>
                  </motion.div>
                )}
              </div>
            </div>

            <label
              htmlFor="profile"
              className="mt-4 inline-flex items-center gap-2 bg-gradient-to-r from-[#fc8f00] to-[#ffb347] text-white px-4 py-2 rounded-lg text-sm font-medium shadow hover:scale-[1.01] transition"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 01-2.828 0L3 9.828" />
              </svg>
              Choose Photo
            </label>
            <input
              type="file"
              accept=".jpg,.jpeg"
              id="profile"
              name="profile"
              onChange={handleImageChange}
              className="hidden"
              aria-label="Upload profile photo (JPEG only)"
            />
            <p className="text-xs text-gray-400 mt-2 text-center">
              JPEG only • Recommended 400x400px (max 1MB)
            </p>
          </motion.div>

          {/* Right: Details */}
          <motion.div
            className="flex-1 w-full flex flex-col gap-4"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  name="name"
                  value={ data.NAME ? data.NAME : ""}
                  // onChange={handleChange}
                  placeholder="Enter Your Name"
                  className="mt-1 w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ffd0a0]"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Phone No</label>
                <input
                  type="text"
                  name="phone"
                  onChange={handleChange}
                  placeholder="Enter Your phone number"
                  className="mt-1 w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ffd0a0]"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Designation</label>
              <input
                type="text"
                name="designation"
                onChange={handleChange}
                placeholder="Enter Your Designation"
                className="mt-1 w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ffd0a0]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">College Name</label>
                <input
                  type="text"
                  name="college"
                  value={data.COLLEGE ? data.COLLEGE : ""}
                  
                  className="mt-1 w-full px-4 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm "
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Email Id</label>
                <input
                  type="text"
                  name="email"
                  value={data.EMAIL ? data.EMAIL : ""}
                  className="mt-1 w-full px-4 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm "

                />
              </div>
            </div>

            <div className="mt-3 flex items-center justify-end">
              <motion.button
                type="button"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-[#fc8f00] to-[#ffb347] text-white px-5 py-2 rounded-lg font-medium shadow hover:brightness-95 transition"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                Update Profile
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default SPOCProfile;
