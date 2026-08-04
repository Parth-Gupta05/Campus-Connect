import React from 'react';
import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-on-surface font-body-lg">
      

<nav className="bg-white/80 dark:bg-background/80 backdrop-blur-xl border-b border-border-light dark:border-outline-variant shadow-sm w-full top-0 sticky z-50 transition-all duration-300" id="main-nav">
<div className="flex justify-between items-center px-gutter w-full max-w-container-max mx-auto h-20">

<a href="#" className="font-headline-md text-headline-md font-bold text-on-surface dark:text-inverse-on-surface flex items-center gap-2 group">
<div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-on-primary group-hover:scale-105 transition-transform">
<span className="material-symbols-outlined text-[20px]" >school</span>
</div>
                Campus Connect
            </a>

<div className="hidden md:flex items-center gap-8 font-body-md text-body-md">
<a href="#features" className="text-on-surface-variant dark:text-surface-variant hover:text-primary dark:hover:text-primary-fixed transition-colors duration-200 font-medium">Features</a>
<a href="#how-it-works" className="text-on-surface-variant dark:text-surface-variant hover:text-primary dark:hover:text-primary-fixed transition-colors duration-200 font-medium">How It Works</a>
<a href="#opportunities" className="text-on-surface-variant dark:text-surface-variant hover:text-primary dark:hover:text-primary-fixed transition-colors duration-200 font-medium">Opportunities</a>
<a href="#students" className="text-on-surface-variant dark:text-surface-variant hover:text-primary dark:hover:text-primary-fixed transition-colors duration-200 font-medium">For Students</a>
<a href="#colleges" className="text-on-surface-variant dark:text-surface-variant hover:text-primary dark:hover:text-primary-fixed transition-colors duration-200 font-medium">For Colleges</a>
</div>

<div className="hidden md:flex items-center gap-4">
<Link to="/signin" className="font-button-text text-button-text text-on-surface-variant hover:text-primary transition-colors py-2 px-4 scale-95 active:opacity-80">Sign In</Link>
<Link to="/signin" className="font-button-text text-button-text bg-primary text-on-primary hover:bg-primary-fixed-variant transition-colors py-2.5 px-5 rounded-lg shadow-sm scale-95 active:opacity-80">Get Started</Link>
</div>

<button className="md:hidden text-on-surface p-2" aria-label="Toggle menu">
<span className="material-symbols-outlined">menu</span>
</button>
</div>
</nav>

<header className="relative pt-24 pb-section-gap-mobile md:pb-section-gap-desktop overflow-hidden">

<div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-ai-gradient-start via-background to-background"></div>
<div className="absolute top-40 right-0 w-[800px] h-[800px] bg-primary-fixed/20 rounded-full blur-3xl -z-10 mix-blend-multiply opacity-50"></div>
<div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-secondary-fixed/30 rounded-full blur-3xl -z-10 mix-blend-multiply opacity-50"></div>
<div className="max-w-container-max mx-auto px-gutter grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

<div className="max-w-2xl">
<div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-container/10 border border-primary-container/20 text-primary mb-6 shadow-sm">
<span className="material-symbols-outlined text-[16px]">flare</span>
<span className="font-label-caps text-label-caps tracking-wider uppercase">AI-Powered Profiling Engine</span>
</div>
<h1 className="font-display-hero-mobile text-display-hero-mobile md:font-display-hero md:text-display-hero text-on-surface mb-6">
                    Your Complete <br />
<span className="text-gradient">Digital Campus</span> <br />
                    Identity.
                </h1>
<p className="font-body-lg text-body-lg text-on-surface-variant mb-10 max-w-xl">
                    Campus Connect continuously translates your academic journey, extracurriculars, and skills into a dynamic, verified profile that connects you with the perfect opportunities.
                </p>
<div className="flex flex-col sm:flex-row gap-4">
<Link to="/signin" className="inline-flex justify-center items-center gap-2 bg-primary text-on-primary font-button-text text-button-text py-3.5 px-8 rounded-lg hover:bg-primary-fixed-variant transition-all shadow-[0_4px_14px_0_rgba(53,37,205,0.39)] hover:shadow-[0_6px_20px_rgba(53,37,205,0.23)] hover:-translate-y-0.5">
                        Get Started
                        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
</Link>
</div>

</div>

<div className="relative w-full aspect-[4/3] lg:aspect-auto lg:h-[600px] flex items-center justify-center">

<div className="absolute inset-0 lg:inset-y-12 lg:right-0 lg:left-12 floating-card overflow-hidden z-10 bg-white/90 backdrop-blur-sm border-white/40">

<div className="h-14 border-b border-border-light bg-bg-subtle/50 flex items-center px-4 justify-between px-6">
<div className="flex items-center gap-3">
<div className="flex gap-1.5">
<div className="w-3 h-3 rounded-full bg-error/80"></div>
<div className="w-3 h-3 rounded-full bg-[#f59e0b]/80"></div>
<div className="w-3 h-3 rounded-full bg-tertiary-container/80"></div>
</div>
<div className="h-4 w-px bg-border-light mx-2"></div>
<div className="text-xs font-medium text-on-surface-variant flex items-center gap-1">
<span className="material-symbols-outlined text-[14px]">lock</span> campusconnect.edu/profile
                            <div className="flex items-center gap-1.5 ml-4 px-2 py-0.5 bg-primary/5 rounded-full border border-primary/10"><div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div><span className="text-[10px] font-semibold text-primary uppercase tracking-tighter">AI Active</span></div></div>
</div>
</div>

<div className="p-6 grid grid-cols-3 gap-6 h-[calc(100%-3.5rem)]">

<div className="col-span-1 border-r border-border-light pr-6 flex flex-col gap-6 py-2">
<div className="flex flex-col items-center text-center">
<div className="w-20 h-20 rounded-full bg-primary-container/10 p-1 mb-3 relative">
<img className="w-full h-full rounded-full object-cover" data-alt="A modern UI profile picture placeholder inside a sleek digital dashboard, showing a diverse student in focus, sharp lighting, corporate SaaS aesthetic." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAgYJzMg1HD7X3zyx4SUkn40vEVzxIjTvO-jyBZ3d6LqecaatxkFCXE1wkSEInTAdlci9khZaq7PEbfa3q7xUyp1DmTP74HmMxdLkxHhn0UxorD7ACIIcwKkjhiIRbhK8BVZCxe037M_74jUD6NeVov1USt5qiaXK26MqbOIUCoLUQI0eWpbRJC1lIDfY-hjQJ18JjtAvo9IeR2hqp3wxbq8IaaiMr53JZSYnLm54mx9TWQN4DS_FZBRxvKV1nhWESnhA_nKLYIeKx7" />
<div className="absolute bottom-0 right-0 w-6 h-6 bg-tertiary-container rounded-full border-2 border-white flex items-center justify-center shadow-sm">
<span className="material-symbols-outlined text-[12px] text-white" >check_circle</span>
</div>
</div>
<h3 className="font-bold text-on-surface">Sarah Jenkins</h3>
<p className="text-xs text-on-surface-variant">Computer Science, 3rd Year</p>
</div>
<div className="space-y-3 px-1">
<div className="flex justify-between items-center text-xs">
<span className="text-on-surface-variant">Profile Strength</span>
<span className="font-bold text-primary">92%</span>
</div>
<div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
<div className="h-full bg-primary w-[92%] rounded-full"></div>
</div>
</div>
<div className="space-y-2 mt-4">
<div className="text-[10px] font-label-caps text-on-surface-variant uppercase tracking-wider">Top Skills</div>
<div className="flex flex-wrap gap-2">
<span className="px-2 py-1 bg-surface-container-high rounded text-xs text-on-surface">Python</span>
<span className="px-2 py-1 bg-surface-container-high rounded text-xs text-on-surface">UI/UX</span>
<span className="px-2 py-1 bg-surface-container-high rounded text-xs text-on-surface">Data Analysis</span>
</div>
</div>
</div>

<div className="col-span-2 flex flex-col gap-4">

<div className="h-32 bg-bg-subtle rounded-lg border border-border-light p-4 relative overflow-hidden">
<div className="text-xs font-semibold text-on-surface mb-2">Skill Progression</div>

<svg className="absolute bottom-0 left-0 w-full h-20 text-primary-fixed" preserveAspectRatio="none" viewBox="0 0 100 100">
<path d="M0,100 L0,50 Q25,30 50,60 T100,20 L100,100 Z" fill="currentColor" opacity="0.3"></path>
<path d="M0,100 L0,60 Q25,40 50,70 T100,30 L100,100 Z" fill="none" stroke="var(--tw-colors-primary)" strokeWidth="2"></path>
</svg>
</div>
<div className="text-[10px] font-label-caps text-on-surface-variant uppercase tracking-wider mt-2">Recommended Opportunities</div>
<div className="flex gap-4 overflow-hidden pb-2">
<div className="min-w-[140px] p-3 border border-border-light rounded-lg hover:border-primary/30 transition-colors bg-white shadow-sm">
<div className="w-8 h-8 rounded bg-[#F0FDF4] text-[#166534] flex items-center justify-center mb-2">
<span className="material-symbols-outlined text-[16px]">work</span>
</div>
<div className="text-xs font-bold text-on-surface truncate">TechNova Internship</div>
<div className="text-[10px] text-on-surface-variant mb-2">Software Eng.</div>
<div className="inline-flex items-center gap-1 text-[10px] font-medium text-tertiary-container bg-tertiary-container/10 px-1.5 py-0.5 rounded">
<span className="material-symbols-outlined text-[10px]">auto_awesome</span> 98% Match
                                    </div>
</div>
<div className="min-w-[140px] p-3 border border-border-light rounded-lg bg-white shadow-sm">
<div className="w-8 h-8 rounded bg-[#EFF6FF] text-[#1D4ED8] flex items-center justify-center mb-2">
<span className="material-symbols-outlined text-[16px]">campaign</span>
</div>
<div className="text-xs font-bold text-on-surface truncate">Hackathon 2024</div>
<div className="text-[10px] text-on-surface-variant mb-2">Campus Event</div>
<div className="inline-flex items-center gap-1 text-[10px] font-medium text-tertiary-container bg-tertiary-container/10 px-1.5 py-0.5 rounded">
<span className="material-symbols-outlined text-[10px]">auto_awesome</span> 91% Match
                                    </div>
</div>
</div>
</div>
</div>
</div>



<div className="absolute -left-4 top-20 z-20 bg-white/90 backdrop-blur-md border border-border-light p-3 rounded-xl shadow-sm flex items-center gap-3 transition-transform hover:scale-105"><div className="w-8 h-8 rounded-full bg-tertiary-container/10 flex items-center justify-center text-tertiary-container"><span className="material-symbols-outlined text-[18px]" >verified</span></div><div><p className="text-[10px] font-bold text-on-surface">Identity Verified</p><p className="text-[8px] text-on-surface-variant uppercase tracking-widest">Blockchain Secured</p></div></div></div>
</div>
</header>

<section className="py-section-gap-mobile md:py-section-gap-desktop bg-white" id="features">
<div className="max-w-container-max mx-auto px-gutter">
<div className="text-center max-w-2xl mx-auto mb-16">
<h2 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg font-bold text-on-surface mb-4">Everything you need to build your campus identity</h2>
<p className="font-body-lg text-body-lg text-on-surface-variant">A comprehensive suite of tools designed to track, analyze, and showcase your academic and extracurricular journey.</p>
</div>
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

<div className="group p-8 rounded-2xl bg-bg-subtle border border-border-light hover:border-primary/30 hover:shadow-md transition-all duration-300">
<div className="w-12 h-12 rounded-xl bg-white shadow-sm border border-border-light flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
<span className="material-symbols-outlined" >account_box</span>
</div>
<h3 className="font-headline-md text-headline-md text-on-surface mb-3">Digital Profile</h3>
<p className="font-body-md text-body-md text-on-surface-variant">A unified, shareable portfolio that replaces traditional static resumes with living, verified data.</p>
</div>

<div className="group p-8 rounded-2xl bg-bg-subtle border border-border-light hover:border-primary/30 hover:shadow-md transition-all duration-300">
<div className="w-12 h-12 rounded-xl bg-white shadow-sm border border-border-light flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
<span className="material-symbols-outlined" >radar</span>
</div>
<h3 className="font-headline-md text-headline-md text-on-surface mb-3">Skill Assessment</h3>
<p className="font-body-md text-body-md text-on-surface-variant">Continuous tracking of soft and hard skills via event participation, assignments, and peer reviews.</p>
</div>

<div className="group p-8 rounded-2xl bg-bg-subtle border border-border-light hover:border-primary/30 hover:shadow-md transition-all duration-300">
<div className="w-12 h-12 rounded-xl bg-white shadow-sm border border-border-light flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
<span className="material-symbols-outlined" >verified</span>
</div>
<h3 className="font-headline-md text-headline-md text-on-surface mb-3">Certificate Repository</h3>
<p className="font-body-md text-body-md text-on-surface-variant">Secure, blockchain-backed storage for all your achievements, ensuring authenticity for employers.</p>
</div>

<div className="group p-8 rounded-2xl bg-bg-subtle border border-border-light hover:border-primary/30 hover:shadow-md transition-all duration-300">
<div className="w-12 h-12 rounded-xl bg-white shadow-sm border border-border-light flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
<span className="material-symbols-outlined" >psychology</span>
</div>
<h3 className="font-headline-md text-headline-md text-on-surface mb-3">AI Career Assistant</h3>
<p className="font-body-md text-body-md text-on-surface-variant">Personalized guidance on what skills to learn next or which events to attend based on your career goals.</p>
</div>

<div className="group p-8 rounded-2xl bg-bg-subtle border border-border-light hover:border-primary/30 hover:shadow-md transition-all duration-300">
<div className="w-12 h-12 rounded-xl bg-white shadow-sm border border-border-light flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
<span className="material-symbols-outlined" >handshake</span>
</div>
<h3 className="font-headline-md text-headline-md text-on-surface mb-3">Opportunity Matching</h3>
<p className="font-body-md text-body-md text-on-surface-variant">Algorithmic matching connects you instantly with relevant internships, jobs, and campus projects.</p>
</div>


</div>
</div>
</section>


    </div>
  );
}
