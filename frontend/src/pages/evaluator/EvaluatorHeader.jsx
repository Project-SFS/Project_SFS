import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiUser, FiLogOut, FiMenu, FiCheckCircle, FiMoreVertical, FiHome } from 'react-icons/fi';
import toast, { Toaster } from 'react-hot-toast';
import { URL } from '../../Utils';

const EvaluatorHeader = ({ setIsOpen }) => {
    const [user, setUser] = useState({ name: '', email: '' });
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetch(`${URL}/cookie`, { method: 'GET', credentials: 'include' });
                if (!res.ok) return;
                const json = await res.json();
                const email = json?.EMAIL || json?.email || json?.Email || '';
                const name = json?.NAME || json?.name || json?.Name || '';
                setUser({ name, email });
            } catch (err) {
                console.debug('Could not fetch user cookie', err);
            }
        };
        fetchUser();
    }, []);

    const performLogout = async () => {
        try {
            await fetch(`${URL}/logout`, { method: 'GET', credentials: 'include' });
        } catch (err) {
           
        }
        try {
            localStorage.clear();
            sessionStorage.clear();
        } catch (e) { }

        toast.custom((t) => (
            <div className={`max-w-sm w-full bg-white border border-gray-200 rounded-lg shadow-md p-3 flex items-start gap-3 ${t.visible ? 'animate-enter' : 'animate-leave'}`}>
                <div className="text-green-600 mt-1"><FiCheckCircle className="w-6 h-6" /></div>
                <div>
                    <div className="font-semibold text-gray-900">Logged out successfully</div>
                    <div className="text-sm text-gray-500">You will be redirected to the login page shortly.</div>
                </div>
            </div>
        ), { duration: 2000 });

        setTimeout(() => navigate('/login'), 2000);
    };

    const handleLogout = () => {
        setIsDropdownOpen(false);
        performLogout();
    };

    return (
        <header className="sticky top-0 z-10 bg-[#4A4A4A] shadow-md border-b border-[#5A5A5A]">
            <Toaster position="top-right" />
            <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
                {/* Left Section */}
                <div className="flex items-center">
                    {/* Mobile Sidebar Toggle (Optional if you want to implement sidebar toggle for Evaluator too) */}
                    <button
                        onClick={() => setIsOpen && setIsOpen(true)}
                        className="rounded-md p-2 text-gray-200 hover:text-primary-accent hover:bg-[#3b3b3b] lg:hidden"
                    >
                        <FiMenu size={24} />
                    </button>
                    <h1 className="ml-2 text-lg font-bold text-white tracking-wide">
                        Evaluator Panel
                    </h1>
                </div>

                {/* Right Section */}
                <div className="flex items-center space-x-4">
                    <div className="hidden sm:flex items-center text-sm text-gray-200">
                        <div className="flex flex-col items-end mr-3">
                            <span className="font-bold text-white leading-tight">{user.name || 'Evaluator'}</span>
                            <span className="text-xs text-gray-400">{user.email}</span>
                        </div>
                        <div className="p-2 bg-gray-600 rounded-full">
                            <FiUser className="h-5 w-5 text-primary-accent" />
                        </div>
                    </div>

                    {/* Three Dots Dropdown */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="flex items-center justify-center p-2 rounded-full text-gray-200 hover:bg-[#3b3b3b] hover:text-white transition-colors focus:outline-none"
                        >
                            <FiMoreVertical size={20} />
                        </button>

                        {isDropdownOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 ring-1 ring-black ring-opacity-5">
                                <Link
                                    to="/"
                                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    onClick={() => setIsDropdownOpen(false)}
                                >
                                    <FiHome className="mr-3 h-4 w-4 text-gray-500" />
                                    Go to Home
                                </Link>
                                <Link
                                    to="/evaluator/profile"
                                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    onClick={() => setIsDropdownOpen(false)}
                                >
                                    <FiUser className="mr-3 h-4 w-4 text-gray-500" />
                                    Edit Profile
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                >
                                    <FiLogOut className="mr-3 h-4 w-4 text-red-500" />
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default EvaluatorHeader;
