import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setIsLoading(true);
    const result = await login(email, password);
    setIsLoading(false);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.error || 'Failed to sign in. Check your credentials.');
    }
  };

  const handleDemoLogin = async () => {
    setEmail('demo@taskmaster.io');
    setPassword('password123');
    setIsLoading(true);
    await login('demo@taskmaster.io', 'password123');
    setIsLoading(false);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#f4f7f6] dark:bg-[#0b131e] flex items-center justify-center p-4 relative overflow-hidden transition-colors">
      {/* Dynamic ambient gradients */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 animate-fade-in">
        {/* Brand header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-[#0d8a72] to-emerald-400 flex items-center justify-center shadow-md shadow-teal-700/20 mb-3 text-white">
            <Sparkles size={28} />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-[#0d8a72] dark:text-teal-400 tracking-tight">Mastery</span>
            <span className="text-3xl font-black text-amber-500 tracking-tight">OS</span>
          </div>
          <span className="text-xs text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider mt-0.5">
            Pro Version
          </span>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Sign in to manage your tasks and level up</p>
        </div>

        {/* Login Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-7 shadow-lg dark:shadow-2xl">
          {error && (
            <div className="flex items-center gap-2 p-3 mb-5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Email Address"
              type="email"
              icon={Mail}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Password"
              type="password"
              icon={Lock}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="mt-2 w-full gap-2"
            >
              <span>Sign In</span>
              <ArrowRight size={16} />
            </Button>
          </form>

          {/* Demo Login Button */}
          <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={handleDemoLogin}
              className="w-full text-xs"
            >
              ⚡ Quick Fill & Demo Login
            </Button>

            <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-2">
              Don't have an account?{' '}
              <Link to="/register" className="text-[#0d8a72] dark:text-teal-400 hover:underline font-bold">
                Create one now
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
