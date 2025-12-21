import { useState } from 'react';
import Header from './Header'
import axios from 'axios';
import { URL } from '../Utils';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      axios.defaults.withCredentials = true;
      const res = await axios.post(`${URL}/login`, { email, password });

      if (res.data.data === 'PENDING') {
        toast.success('Please try again after some time', { duration: 7000 });
        toast.success('Your request for login is sent', { duration: 7000 });
        return;
      }

      if (res.data.data === 'REJECTED') {
        toast.error('You are not allowed to access as a spoc');
        return;
      }

      if (res.data.data) {
        toast.success('Login Successful');
        setTimeout(() => {
          const role = res.data.user?.[0]?.ROLE;
          if (role === 'SPOC') navigate('/spoc');
          else if (role === 'EVALUATOR') navigate('/evaluator');
          else if (role === 'ADMIN') navigate('/admin');
          else if (role === 'STUDENT') navigate('/student');
          else navigate('/');
        }, 1000);
        return;
      }

      toast.error('Invalid Credentials');
    } catch (error) {
      console.log(error);
      if (error.response && error.response.status === 401) {
        toast.error(error.response.data?.message || 'Invalid Credentials');
      } else {
        toast.error('Login Failed. Please try again.');
      }
    }
  };

  return (
   <div className="min-h-screen  flex items-center justify-center p-4 mt-8">
  <Header />
  <Toaster position="top-right" />

  {/* Centered Card */}
  <div className="bg-white rounded-2xl shadow-2xl p-10 w-full max-w-md mx-auto">
    
    <div className="text-center mb-8">
      <h3 className="text-3xl font-bold text-gray-800 mb-2">
        Sign In
      </h3>
      <p className="text-gray-600">
        Enter your credentials to access your account
      </p>
    </div>

    <form onSubmit={handleLogin} className="space-y-6">

      {/* Email */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Email Address
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="Enter Your Email"
          className="w-full pl-4 py-3 border border-gray-300 rounded-lg"
        />
      </div>

      {/* Password */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Password
        </label>
        <input
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          placeholder="Enter Your password"
          className="w-full pl-4 py-3 border border-gray-300 rounded-lg"
        />
      </div>

      <button
        type="submit"
        className="w-full bg-orange-600 text-white py-3 rounded-lg font-semibold"
      >
        Sign In
      </button>
    </form>

    <div className="mt-8 text-center">
      <p className="text-gray-600">
        Don't have an account?{" "}
        <a href="/register" className="text-orange-600 font-medium">
          Register here
        </a>
      </p>
    </div>
  </div>
</div>



  );
};

export default Login;
