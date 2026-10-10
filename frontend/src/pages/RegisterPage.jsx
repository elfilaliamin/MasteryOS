import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export const RegisterPage = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  // Password strength calculation
  const getPasswordStrength = () => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 6) score += 1;
    if (password.length >= 10) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    return score;
  };

  const strength = getPasswordStrength();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!fullName || !email || !password) {
      setError('Please fill out all required fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    const result = await register(fullName, email, password);
    setIsLoading(false);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.error || 'Failed to create account.');
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7f6] dark:bg-[#0b131e] flex items-center justify-center p-4 relative overflow-hidden transition-colors">
      {/* Ambient glowing orbs */}
      <div className="absolute top-1/4 -right-20 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 animate-fade-in">
        {/* Brand Header */}
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
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Create your account & unlock your first title</p>
        </div>

        {/* Register Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-7 shadow-lg dark:shadow-2xl">
          {error && (
            <div className="flex items-center gap-2 p-3 mb-5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Full Name"
              type="text"
              icon={User}
              placeholder="e.g., Alex Mercer"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />

            <Input
              label="Email Address"
              type="email"
              icon={Mail}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <div>
              <Input
                label="Password"
                type="password"
                icon={Lock}
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              {/* Password strength visual indicator */}
              {password && (
                <div className="mt-2 flex items-center gap-1.5">
                  {[1, 2, 3, 4].map((step) => (
                    <div
                      key={step}
                      className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                        step <= strength
                          ? strength >= 3
                            ? 'bg-emerald-500'
                            : strength === 2
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                          : 'bg-slate-200 dark:bg-slate-800'
                      }`}
                    />
                  ))}
                  <span className="text-[10px] text-slate-500 font-bold ml-1">
                    {strength >= 3 ? 'Strong' : strength === 2 ? 'Medium' : 'Weak'}
                  </span>
                </div>
              )}
            </div>

            <Input
              label="Confirm Password"
              type="password"
              icon={Lock}
              placeholder="Repeat your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="mt-3 w-full gap-2"
            >
              <span>Create Account & Start</span>
              <ArrowRight size={16} />
            </Button>
          </form>

          <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
            Already have an account?{' '}
            <Link to="/login" className="text-[#0d8a72] dark:text-teal-400 font-bold hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
