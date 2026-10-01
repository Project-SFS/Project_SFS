import { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiMail, FiLock, FiEye, FiEyeOff, FiLogIn, FiInfo } from 'react-icons/fi';
import AuthLayout from './AuthLayout';
import { URL } from '../Utils';

const input = "w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-[#fc9300] transition";

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      axios.defaults.withCredentials = true;
      const res = await axios.post(`${URL}/login`, { email, password });

      if (res.data.data === 'PENDING') {
        toast('Your SPOC account is waiting for admin approval. You will get an email once it is approved.', { icon: '⏳', duration: 7000 });
        return;
      }

      if (res.data.data === 'REJECTED') {
        toast.error('Your account request was not approved');
        return;
      }

      if (res.data.data) {
        toast.success('Login successful');
        setTimeout(() => {
          const role = res.data.user?.[0]?.ROLE;
          if (role === 'SPOC') navigate('/spoc');
          else if (role === 'ADMIN') navigate('/admin');
          else if (role === 'STUDENT') navigate('/student');
          else navigate('/');
        }, 800);
        return;
      }

      toast.error('Invalid email or password');
    } catch (error) {
      if (error.response && [401, 403, 429].includes(error.response.status)) {
        toast.error(error.response.data?.message || 'Invalid email or password');
      } else {
        toast.error('Login failed. Please try again.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to continue to the Solve For Sakthi portal.">
      <form onSubmit={handleLogin} className="space-y-5">
        <div>
          <label htmlFor="login-email" className="block text-sm font-semibold text-gray-700 mb-1.5">Email address</label>
          <div className="relative">
            <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              id="login-email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className={input}
            />
          </div>
        </div>

        <div>
          <label htmlFor="login-password" className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
          <div className="relative">
            <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Your password"
              className={`${input} !pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 px-4 flex items-center text-gray-400 hover:text-gray-600"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={busy}
          className="w-full inline-flex items-center justify-center gap-2 bg-[#fc9300] text-white py-3 rounded-xl font-semibold hover:bg-[#e68400] focus:outline-none focus:ring-2 focus:ring-orange-300 focus:ring-offset-2 transition disabled:opacity-60"
        >
          <FiLogIn /> {busy ? 'Signing in…' : 'Sign in'}
        </button>

        <div className="flex gap-2 rounded-xl bg-gray-50 border border-gray-100 px-4 py-3 text-xs text-gray-600">
          <FiInfo className="shrink-0 mt-0.5 text-gray-400" />
          <span>Forgot your password? Team logins: ask your SPOC to set a new one. SPOCs: ask the platform admin.</span>
        </div>
      </form>

      <p className="mt-6 text-center text-gray-600">
        College coordinator without an account?{' '}
        <Link to="/register" className="text-[#fc9300] hover:text-[#c76f00] font-semibold">Register as a SPOC</Link>
      </p>
    </AuthLayout>
  );
};

export default Login;
