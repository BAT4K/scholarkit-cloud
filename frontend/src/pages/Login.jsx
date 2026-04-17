import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Login({ mode = 'login' }) {
  const [isLogin, setIsLogin] = useState(mode !== 'register');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setIsLogin(mode !== 'register');
  }, [mode]);

  useEffect(() => {
    if (user) {
      navigate(localStorage.getItem('selectedSchool') ? '/shop' : '/select-school', { replace: true });
    }
  }, [navigate, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (isLogin) {
        await login(email, password);
        toast.success('Welcome back to ScholarKit.');
      } else {
        await register(name, email, password);
        toast.success('Your account is ready.');
      }
      const redirectPath = location.state?.from?.pathname || (localStorage.getItem('selectedSchool') ? '/shop' : '/select-school');
      navigate(redirectPath, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#dbeafe,_#f8fafc_40%,_#eef2ff)] px-4 py-12">
      <div className="w-full max-w-md rounded-[2rem] border border-white/70 bg-white/90 p-8 shadow-xl shadow-slate-200/70 backdrop-blur">
        <p className="mb-3 text-center text-xs font-black uppercase tracking-[0.3em] text-indigo-600">ScholarKit</p>
        <h2 className="mb-2 text-center text-3xl font-black text-slate-900">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h2>
        <p className="mb-6 text-center text-sm text-slate-500">
          {isLogin ? 'Sign in to manage your cart, orders, and school selections.' : 'Create an account to start shopping and tracking orders.'}
        </p>

        {error && (
          <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-slate-700">Name</label>
              <input
                type="text"
                required
                className="mt-1 block w-full rounded-xl border border-slate-300 px-4 py-3 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700">Email Address</label>
            <input
              type="email"
              required
              className="mt-1 block w-full rounded-xl border border-slate-300 px-4 py-3 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Password</label>
            <input
              type="password"
              required
              className="mt-1 block w-full rounded-xl border border-slate-300 px-4 py-3 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full justify-center rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
          >
            {submitting ? 'Please wait...' : isLogin ? 'Login' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-600">
          <p>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <Link
              to={isLogin ? '/register' : '/login'}
              className="font-semibold text-indigo-600 hover:text-indigo-500"
            >
              {isLogin ? 'Sign up' : 'Log in'}
            </Link>
          </p>
          <p className="mt-4">
            <Link to="/select-school" className="font-semibold text-slate-500 hover:text-slate-700">
              Browse schools first
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
