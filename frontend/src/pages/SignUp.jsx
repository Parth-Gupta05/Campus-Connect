import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { FiLoader } from 'react-icons/fi';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('/auth/register', {
        email,
        password,
        role: 'student'
      });

      login(response.data);
      navigate('/profile');
    } catch (err) {
      setError(
        err.response?.data?.message || 
        'Failed to create account. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-body-lg">
      <main className="flex-1 flex flex-col md:flex-row">
        {/* Left Side (Visuals) */}
        <div className="hidden md:flex flex-col w-1/2 p-12 relative overflow-hidden bg-surface-container-lowest border-r border-border-light justify-center">
          <div className="absolute inset-0 z-0 pointer-events-none opacity-50">
            <div className="absolute top-[-10%] left-[-10%] w-2/3 h-2/3 bg-ai-gradient-start rounded-full blur-[120px]"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-2/3 h-2/3 bg-ai-gradient-end rounded-full blur-[120px]"></div>
          </div>
          <div className="z-10 max-w-lg mx-auto">
            <div className="flex items-center gap-3 mb-12">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-on-primary shadow-sm">
                <span className="material-symbols-outlined text-[24px]">school</span>
              </div>
              <span className="font-display-hero text-headline-md text-primary tracking-tight">Campus Connect</span>
            </div>
            <h1 className="font-display-hero text-display-hero text-on-surface mb-6 leading-tight">Start your legacy.</h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant mb-12">
              Join thousands of students building their digital portfolios and tracking their engineering metrics in one unified platform.
            </p>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined">workspace_premium</span>
                </div>
                <div>
                  <h3 className="font-bold text-on-surface">Verified Credentials</h3>
                  <p className="text-sm text-on-surface-variant">Secure digital certificates</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined">trending_up</span>
                </div>
                <div>
                  <h3 className="font-bold text-on-surface">Growth Analytics</h3>
                  <p className="text-sm text-on-surface-variant">Visualize your trajectory</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side (Form) */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 bg-surface">
          <div className="w-full max-w-md">
            {/* Mobile Branding */}
            <div className="md:hidden flex items-center justify-center gap-2 mb-10">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-on-primary">
                <span className="material-symbols-outlined text-[20px]">school</span>
              </div>
              <span className="font-display-hero text-headline-sm text-primary">Campus Connect</span>
            </div>

            <div className="bg-surface-container-lowest p-8 md:p-10 rounded-3xl border border-border-light shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <div className="text-center mb-8">
                <h2 className="font-display-hero text-headline-lg text-on-surface mb-2 tracking-tight">Create Account</h2>
                <p className="text-body-md text-on-surface-variant">Join Campus Connect today.</p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-error-container text-on-error-container rounded-xl text-sm flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">error</span>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-label-lg font-medium text-on-surface mb-2" htmlFor="email">
                    College Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-outline">
                      <span className="material-symbols-outlined text-[18px]">mail</span>
                    </div>
                    <input
                      id="email"
                      type="email"
                      required
                      className="w-full pl-10 p-3.5 bg-surface border border-outline-variant rounded-xl text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-outline-variant"
                      placeholder="student@university.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-label-lg font-medium text-on-surface mb-2" htmlFor="password">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-outline">
                      <span className="material-symbols-outlined text-[18px]">lock</span>
                    </div>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      className="w-full pl-10 pr-10 p-3.5 bg-surface border border-outline-variant rounded-xl text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-outline-variant"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-outline hover:text-primary transition-colors focus:outline-none"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-label-lg font-medium text-on-surface mb-2" htmlFor="confirmPassword">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-outline">
                      <span className="material-symbols-outlined text-[18px]">lock_reset</span>
                    </div>
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      className="w-full pl-10 pr-10 p-3.5 bg-surface border border-outline-variant rounded-xl text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-outline-variant"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-outline hover:text-primary transition-colors focus:outline-none"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {showConfirmPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                <button disabled={loading} type="submit" className="w-full bg-primary text-on-primary py-3 rounded-lg font-button-text hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-sm disabled:opacity-70 flex justify-center items-center gap-2">
                  {loading ? (
                    <FiLoader className="animate-spin text-[24px]" />
                  ) : (
                    <>Sign Up <span className="material-symbols-outlined text-[18px]">person_add</span></>
                  )}
                </button>
              </form>

              <div className="mt-8 text-center text-body-md text-on-surface-variant">
                Already have an account?{' '}
                <Link to="/signin" className="text-primary font-semibold hover:underline">
                  Sign In
                </Link>
              </div>
            </div>

            {/* Badges */}
            <div className="mt-8 flex flex-row items-center justify-center gap-6 opacity-70">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-on-surface-variant">shield_lock</span>
                <span className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold">Secure Auth</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-on-surface-variant">verified</span>
                <span className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold">College Verified</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Standard Footer */}
      <footer className="w-full border-t border-border-light bg-surface py-6 px-gutter flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-on-surface-variant">
        <div className="flex items-center gap-2 font-semibold">
          <span className="material-symbols-outlined text-[18px]">school</span> Campus Connect
        </div>
        <div className="flex items-center gap-6">
          <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-primary transition-colors">Help Center</a>
        </div>
      </footer>
    </div>
  );
}
