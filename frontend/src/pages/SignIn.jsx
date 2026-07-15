import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      const user = await login(email, password);
      if (user.role === 'admin') navigate('/admin');
      else navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="flex min-h-screen bg-background text-on-surface font-body-lg">
      

<div className="hidden md:flex flex-col md:w-5/12 lg:w-1/2 p-8 lg:p-12 relative overflow-hidden bg-bg-subtle border-r border-outline-variant/20">

<div className="absolute inset-0 z-0 pointer-events-none opacity-40">
<div className="absolute top-[-10%] left-[-10%] w-2/3 h-2/3 bg-ai-gradient-start rounded-full blur-[100px]"></div>
<div className="absolute bottom-[-10%] right-[-10%] w-2/3 h-2/3 bg-ai-gradient-end rounded-full blur-[100px]"></div>

<svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
<defs>
<pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
<path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-outline"></path>
</pattern>
</defs>
<rect width="100%" height="100%" fill="url(#grid)"></rect>
</svg>
</div>

<div className="z-10 flex items-center gap-2 mb-auto">
<div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-on-primary">
<span className="material-symbols-outlined text-[20px]" data-icon="school">school</span>
</div>
<span className="font-headline-md text-headline-md text-primary">Campus Connect</span>
</div>

<div className="z-10 mt-24 mb-auto max-w-lg">
<h1 className="font-display-hero text-headline-lg lg:text-display-hero text-on-surface mb-6">Build your digital campus identity.</h1>
<p className="font-body-lg text-body-lg text-on-surface-variant mb-12">
                Build your profile, track skills, manage achievements, and discover opportunities powered by intelligent matching.
            </p>

<ul className="space-y-6">
<li className="flex items-start gap-4 group">
<div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-on-primary transition-colors duration-300">
<span className="material-symbols-outlined" data-icon="robot_2">robot_2</span>
</div>
<div>
<h3 className="font-headline-md text-[16px] text-on-surface">AI-powered Student Profile</h3>
<p className="font-body-md text-[14px] text-on-surface-variant">Automated skill extraction and narrative building.</p>
</div>
</li>
<li className="flex items-start gap-4 group">
<div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-on-primary transition-colors duration-300">
<span className="material-symbols-outlined" data-icon="hub">hub</span>
</div>
<div>
<h3 className="font-headline-md text-[16px] text-on-surface">Smart Opportunity Matching</h3>
<p className="font-body-md text-[14px] text-on-surface-variant">Connect with projects that fit your exact skill vector.</p>
</div>
</li>
<li className="flex items-start gap-4 group">
<div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-on-primary transition-colors duration-300">
<span className="material-symbols-outlined" data-icon="trending_up">trending_up</span>
</div>
<div>
<h3 className="font-headline-md text-[16px] text-on-surface">Skill Growth Analytics</h3>
<p className="font-body-md text-[14px] text-on-surface-variant">Visualize your academic and professional trajectory.</p>
</div>
</li>
<li className="flex items-start gap-4 group">
<div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-on-primary transition-colors duration-300">
<span className="material-symbols-outlined" data-icon="workspace_premium">workspace_premium</span>
</div>
<div>
<h3 className="font-headline-md text-[16px] text-on-surface">Digital Certificate Repository</h3>
<p className="font-body-md text-[14px] text-on-surface-variant">Verified credentials securely stored and shareable.</p>
</div>
</li>
</ul>
</div>

<div className="z-10 mt-12 rounded-xl overflow-hidden shadow-lg border border-border-light relative h-48 w-full hidden lg:block" data-alt="A highly detailed, sophisticated digital illustration of abstract nodes connecting in a glowing network grid. The style is modern minimal SaaS, using deep indigos, soft bright whites, and subtle glassmorphism effects. The lighting is pristine and high-key, conveying a sense of academic intelligence, data flow, and modern professional networking without being overly literal." >
<div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
</div>
</div>

<div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 relative bg-surface">

<div className="md:hidden flex items-center gap-2 mb-8 absolute top-8 left-6">
<div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-on-primary">
<span className="material-symbols-outlined text-[20px]" data-icon="school">school</span>
</div>
<span className="font-headline-md text-[20px] text-primary">Campus Connect</span>
</div>
<div className="w-full max-w-md mt-16 md:mt-0">

<div className="bg-surface-container-lowest rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-border-light p-8">
<div className="mb-8 text-center">
<h2 className="font-headline-md text-headline-md text-on-surface mb-2">Welcome Back</h2>
<p className="font-body-md text-[14px] text-on-surface-variant">Sign in to access your digital campus identity.</p>
</div>
<form onSubmit={handleSubmit} className="space-y-5">
{error && <div className="p-3 bg-error-container text-on-error-container rounded-lg text-sm">{error}</div>}

<div>
<label className="block font-label-caps text-label-caps text-on-surface-variant mb-2" htmlFor="email">College Email</label>
<div className="relative">
<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-outline">
<span className="material-symbols-outlined text-[18px]" data-icon="mail">mail</span>
</div>
<input className="block w-full pl-10 pr-3 py-2.5 border border-border-light rounded-lg font-body-md text-[14px] text-on-surface bg-surface focus:ring-1 focus:ring-primary focus:border-primary transition-all duration-200 placeholder:text-outline/60" id="email" placeholder="student@university.edu" required="" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
</div>
</div>

<div>
<label className="block font-label-caps text-label-caps text-on-surface-variant mb-2" htmlFor="password">Password</label>
<div className="relative">
<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-outline">
<span className="material-symbols-outlined text-[18px]" data-icon="lock">lock</span>
</div>
<input className="block w-full pl-10 pr-3 py-2.5 border border-border-light rounded-lg font-body-md text-[14px] text-on-surface bg-surface focus:ring-1 focus:ring-primary focus:border-primary transition-all duration-200 placeholder:text-outline/60" id="password" placeholder="••••••••" required="" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
</div>
</div>

<div className="flex items-center justify-between mt-4">
<div className="flex items-center">
<input className="h-4 w-4 text-primary focus:ring-primary border-border-light rounded bg-surface" id="remember-me" name="remember-me" type="checkbox" />
<label className="ml-2 block font-body-md text-[13px] text-on-surface-variant" htmlFor="remember-me">
                                Remember me
                            </label>
</div>
<div className="text-sm">
<a className="font-button-text text-button-text text-primary hover:text-on-primary-fixed-variant transition-colors" href="#">
                                Forgot Password?
                            </a>
</div>
</div>

<button className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm font-button-text text-button-text text-on-primary bg-primary hover:bg-surface-tint focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200 active:scale-[0.98] mt-6" type="submit">
                        Sign In
                    </button>
</form>

<div className="mt-6">
<div className="relative">
<div className="absolute inset-0 flex items-center">
<div className="w-full border-t border-border-light"></div>
</div>
<div className="relative flex justify-center text-sm">
<span className="px-2 bg-surface-container-lowest font-body-md text-[12px] text-outline">or continue with</span>
</div>
</div>
</div>

<div className="mt-6">
<button className="w-full flex items-center justify-center gap-3 py-2.5 px-4 border border-border-light rounded-lg shadow-sm bg-surface-container-lowest font-button-text text-[14px] text-on-surface hover:bg-surface-container-low focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-outline-variant transition-colors duration-200" type="button">
<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
<path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
<path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
<path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
<path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
</svg>
                        College Verified Google Account
                    </button>
</div>

<div className="mt-8 text-center">
<p className="font-body-md text-[13px] text-on-surface-variant">
                        Don't have an account? 
                        <a className="font-button-text text-primary hover:text-on-primary-fixed-variant transition-colors ml-1" href="#">Create Account</a>
</p>
</div>
</div>

<div className="mt-8 flex flex-row items-center justify-center gap-6">
<div className="flex items-center gap-2 group cursor-default">
<div className="p-1.5 rounded-md bg-secondary-fixed/50 text-secondary-container group-hover:bg-secondary-fixed transition-colors">
<span className="material-symbols-outlined text-[16px]" data-icon="shield_lock">shield_lock</span>
</div>
<span className="font-label-caps text-[10px] text-on-surface-variant">Secure Auth</span>
</div>
<div className="flex items-center gap-2 group cursor-default">
<div className="p-1.5 rounded-md bg-tertiary-fixed/30 text-tertiary group-hover:bg-tertiary-fixed/50 transition-colors">
<span className="material-symbols-outlined text-[16px]" data-icon="verified">verified</span>
</div>
<span className="font-label-caps text-[10px] text-on-surface-variant">College Verified</span>
</div>
<div className="flex items-center gap-2 group cursor-default">
<div className="p-1.5 rounded-md bg-surface-container-highest text-outline group-hover:bg-outline-variant/30 transition-colors">
<span className="material-symbols-outlined text-[16px]" data-icon="admin_panel_settings">admin_panel_settings</span>
</div>
<span className="font-label-caps text-[10px] text-on-surface-variant">Role Based</span>
</div>
</div>
</div>

<footer className="bg-transparent w-full mt-auto flex flex-row justify-between items-center py-6 px-gutter border-t border-outline-variant/20 absolute bottom-0 left-0 right-0">
<div className="flex items-center gap-4">
<span className="font-headline-md text-[16px] text-primary">Campus Connect</span>
<span className="font-label-caps text-label-caps text-on-surface-variant hidden sm:inline-block">v2.4.1</span>
</div>
<div className="flex items-center gap-4">
<a className="font-label-caps text-label-caps text-on-surface-variant hover:text-primary transition-colors" href="#">Privacy Policy</a>
<a className="font-label-caps text-label-caps text-on-surface-variant hover:text-primary transition-colors" href="#">Terms of Service</a>
<a className="font-label-caps text-label-caps text-on-surface-variant hover:text-primary transition-colors" href="#">Help Center</a>
</div>
</footer>
</div>

    </div>
  );
}
