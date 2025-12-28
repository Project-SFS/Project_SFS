import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { URL } from '../../Utils';
import toast, { Toaster } from 'react-hot-toast';
import { FiUser, FiPhone, FiSave, FiArrowLeft } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const EvaluatorProfile = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        id: '',
        name: '',
        phone: '',
        email: ''
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await axios.get(`${URL}/cookie`, { withCredentials: true });
                const data = res.data;

                if (data) {
                    setFormData({
                        id: data.ID || data.id,
                        name: data.NAME || data.name || '',
                        phone: data.PHONE || data.phone || '',
                        email: data.EMAIL || data.email || ''
                    });
                }
            } catch (err) {
               
                toast.error("Could not load profile");
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.put(`${URL}/update-user`, {
                id: formData.id,
                name: formData.name,
                phone: formData.phone
            }, { withCredentials: true });

            toast.success("Profile updated successfully!");
            setTimeout(() => navigate(-1), 1000); // Navigate back after 1 second
        } catch (err) {
          
            toast.error("Failed to update profile");
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-[#F7F8FC]">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#FF9900]"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F7F8FC] p-6 lg:p-10">
            <Toaster position="top-right" />

            <div className="max-w-2xl mx-auto">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center text-gray-500 hover:text-[#FF9900] mb-6 transition-colors"
                >
                    <FiArrowLeft className="mr-2" /> Back
                </button>

                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                        <FiUser className="mr-3 text-[#FF9900]" /> Edit Profile
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Read Only Email */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-500 mb-2">Email Address</label>
                            <input
                                type="email"
                                value={formData.email}
                                disabled
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-500 cursor-not-allowed"
                            />
                            <p className="text-xs text-gray-400 mt-1">Email cannot be changed.</p>
                        </div>

                        {/* Name Field */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FiUser className="text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full pl-10 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#FF9900]/20 focus:border-[#FF9900] outline-none transition-colors text-gray-800"
                                    placeholder="Enter your name"
                                    required
                                />
                            </div>
                        </div>

                        {/* Phone Field */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FiPhone className="text-gray-400" />
                                </div>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="w-full pl-10 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#FF9900]/20 focus:border-[#FF9900] outline-none transition-colors text-gray-800"
                                    placeholder="Enter your phone number"
                                />
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                className="w-full bg-[#FF9900] hover:bg-[#E68500] text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 transform active:scale-95"
                            >
                                <FiSave /> Save Changes
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EvaluatorProfile;
