import React from 'react';
import Sidebar from '../components/Sidebar';

export default function StudentDashboard() {
  
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background text-on-surface font-body-lg">
      

<header className="md:hidden bg-white/80 backdrop-blur-xl border-b border-border-light shadow-sm flex justify-between items-center px-gutter h-20 z-50 sticky top-0 w-full">
<span className="font-headline-md text-headline-md font-bold text-on-surface">Campus Connect</span>
<div className="flex gap-4">
<span className="material-symbols-outlined text-on-surface-variant cursor-pointer">notifications</span>
<span className="material-symbols-outlined text-on-surface-variant cursor-pointer">menu</span>
</div>
</header>

<Sidebar />

<main className="flex-1 overflow-y-auto">

<div className="hidden md:flex bg-white/80 backdrop-blur-xl border-b border-border-light shadow-sm justify-between items-center px-gutter h-20 z-50 sticky top-0 w-full">
<div className="relative w-96">
<span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
<input className="w-full pl-10 pr-4 py-2 bg-surface-container-low border border-border-light rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-body-md text-body-md text-on-surface placeholder:text-text-slate" placeholder="Search opportunities, events..." type="text" />
</div>
<div className="flex items-center gap-6">
<span className="material-symbols-outlined text-on-surface-variant hover:text-primary cursor-pointer transition-colors">notifications</span>
</div>
</div>
<div className="p-gutter md:p-12 max-w-container-max mx-auto space-y-section-gap-mobile md:space-y-section-gap-desktop">

<section className="flex flex-col lg:flex-row gap-8 items-start justify-between">
<div>
<h1 className="font-display-hero-mobile md:font-display-hero text-display-hero-mobile md:text-display-hero text-on-surface mb-2">Good Morning, Tarun</h1>
<div className="flex flex-wrap items-center gap-4 text-on-surface-variant font-body-lg text-body-lg">
<span className="flex items-center gap-1"><span className="material-symbols-outlined text-primary">school</span> Semester 6, Computer Science</span>
<span className="w-1 h-1 rounded-full bg-border-light"></span>
<span className="flex items-center gap-1"><span className="material-symbols-outlined text-tertiary-container">verified</span> Campus Score: <strong>840</strong></span>
</div>
<div className="mt-6 flex flex-wrap gap-4">
<button className="bg-primary text-on-primary px-6 py-3 rounded-lg font-button-text text-button-text hover:bg-on-primary-fixed transition-colors duration-200 shadow-sm">Complete Profile</button>
<button className="bg-white border border-border-light text-on-surface px-6 py-3 rounded-lg font-button-text text-button-text hover:border-primary hover:text-primary transition-colors duration-200 shadow-sm flex items-center gap-2">
<span className="material-symbols-outlined text-sm">upload</span> Upload Activity
                        </button>
</div>
</div>

<div className="bg-white border border-border-light rounded-xl p-6 shadow-md w-full lg:w-80 shrink-0 relative overflow-hidden">
<div className="absolute -right-8 -top-8 w-32 h-32 bg-ai-gradient-start rounded-full blur-2xl"></div>
<h3 className="font-label-caps text-label-caps uppercase text-on-surface-variant mb-4">Profile Strength</h3>
<div className="flex items-end justify-between mb-2">
<span className="font-headline-lg text-headline-lg text-primary">78%</span>
</div>
<div className="w-full bg-surface-container-low h-2 rounded-full overflow-hidden">
<div className="bg-primary h-full rounded-full w-[78%]"></div>
</div>
<p className="font-body-md text-body-md text-text-slate mt-4 text-sm">Add 2 more projects to reach 90%.</p>
</div>
</section>

<section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
<div className="bg-white border border-border-light rounded-xl p-4 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
<span className="material-symbols-outlined text-primary mb-2">psychology</span>
<div>
<div className="font-headline-md text-headline-md text-on-surface">84</div>
<div className="font-label-caps text-label-caps text-on-surface-variant uppercase mt-1">Skill Score</div>
</div>
</div>
<div className="bg-white border border-border-light rounded-xl p-4 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
<span className="material-symbols-outlined text-secondary-container mb-2">local_activity</span>
<div>
<div className="font-headline-md text-headline-md text-on-surface">12</div>
<div className="font-label-caps text-label-caps text-on-surface-variant uppercase mt-1">Activities</div>
</div>
</div>
<div className="bg-white border border-border-light rounded-xl p-4 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
<span className="material-symbols-outlined text-tertiary-container mb-2">workspace_premium</span>
<div>
<div className="font-headline-md text-headline-md text-on-surface">8</div>
<div className="font-label-caps text-label-caps text-on-surface-variant uppercase mt-1">Certificates</div>
</div>
</div>
<div className="bg-white border border-border-light rounded-xl p-4 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
<span className="material-symbols-outlined text-surface-tint mb-2">event_available</span>
<div>
<div className="font-headline-md text-headline-md text-on-surface">5</div>
<div className="font-label-caps text-label-caps text-on-surface-variant uppercase mt-1">Events</div>
</div>
</div>
<div className="bg-white border border-border-light rounded-xl p-4 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
<span className="material-symbols-outlined text-primary-container mb-2">handshake</span>
<div>
<div className="font-headline-md text-headline-md text-on-surface">14</div>
<div className="font-label-caps text-label-caps text-on-surface-variant uppercase mt-1">Matches</div>
</div>
</div>
<div className="bg-white border border-border-light rounded-xl p-4 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
<span className="material-symbols-outlined text-on-primary-fixed-variant mb-2">military_tech</span>
<div>
<div className="font-headline-md text-headline-md text-on-surface">#12</div>
<div className="font-label-caps text-label-caps text-on-surface-variant uppercase mt-1">Rank</div>
</div>
</div>
</section>

<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

<div className="lg:col-span-1 flex flex-col gap-8">

<section className="bg-white border border-border-light rounded-xl p-6 shadow-md relative overflow-hidden">
<div className="absolute inset-0 bg-gradient-to-br from-surface-container-low to-transparent opacity-50 pointer-events-none"></div>
<div className="flex justify-between items-center mb-6 relative z-10">
<h2 className="font-headline-md text-headline-md text-on-surface">Skill Profile</h2>
<span className="material-symbols-outlined text-on-surface-variant cursor-pointer hover:text-primary">info</span>
</div>
<div className="aspect-square bg-surface-container-lowest rounded-full border border-border-light flex items-center justify-center relative shadow-sm">

<div className="absolute inset-0 flex items-center justify-center opacity-10">
<span className="material-symbols-outlined text-[120px] text-primary">radar</span>
</div>
<div className="text-center p-4">
<p className="font-label-caps text-label-caps text-on-surface-variant uppercase mb-2">Technical Leading</p>
<p className="font-body-md text-body-md text-text-slate text-sm">Visualizing 8 core competencies.</p>
</div>
</div>
</section>

<section className="bg-bg-subtle rounded-xl p-6 border border-border-light">
<h2 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2 mb-6">
<span className="material-symbols-outlined text-primary">auto_awesome</span> AI Insights
                        </h2>
<div className="space-y-4">
<div className="bg-white p-4 rounded-lg shadow-sm border border-border-light hover:border-primary transition-colors cursor-pointer">
<div className="flex items-center gap-3 mb-2">
<span className="material-symbols-outlined text-secondary-container">trending_up</span>
<h4 className="font-button-text text-button-text font-bold text-on-surface">Improve React Skill</h4>
</div>
<p className="font-body-md text-body-md text-sm text-text-slate">Based on recent internship matches.</p>
</div>
<div className="bg-white p-4 rounded-lg shadow-sm border border-border-light hover:border-primary transition-colors cursor-pointer">
<div className="flex items-center gap-3 mb-2">
<span className="material-symbols-outlined text-tertiary-container">route</span>
<h4 className="font-button-text text-button-text font-bold text-on-surface">Path: DevOps</h4>
</div>
<p className="font-body-md text-body-md text-sm text-text-slate">Suggested learning trajectory.</p>
</div>
<div className="bg-white p-4 rounded-lg shadow-sm border border-border-light hover:border-primary transition-colors cursor-pointer">
<div className="flex items-center gap-3 mb-2">
<span className="material-symbols-outlined text-primary-container">code</span>
<h4 className="font-button-text text-button-text font-bold text-on-surface">Taurex AI Hackathon</h4>
</div>
<p className="font-body-md text-body-md text-sm text-text-slate">Highly recommended event.</p>
</div>
</div>
</section>
</div>

<div className="lg:col-span-2 flex flex-col gap-8">

<section>
<div className="flex justify-between items-center mb-6">
<h2 className="font-headline-md text-headline-md text-on-surface">Top Matches</h2>
<a className="font-button-text text-button-text text-primary hover:underline flex items-center gap-1" href="#">View All <span className="material-symbols-outlined text-sm">arrow_forward</span></a>
</div>
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">

<div className="bg-white border border-border-light rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative">
<div className="absolute top-4 right-4 bg-tertiary-container/10 text-tertiary-container px-2 py-1 rounded-full font-label-caps text-label-caps flex items-center gap-1">
<span className="material-symbols-outlined text-[14px]">check_circle</span> 94% Match
                                </div>
<div className="w-12 h-12 bg-surface-container-low rounded-lg flex items-center justify-center mb-4 text-primary">
<span className="material-symbols-outlined">work</span>
</div>
<h3 className="font-body-lg text-body-lg font-bold text-on-surface mb-1">Software Engineering Intern</h3>
<p className="font-body-md text-body-md text-on-surface-variant text-sm mb-4">TechNova Solutions • Remote</p>
<div className="mb-4">
<div className="font-label-caps text-label-caps text-text-slate mb-2">Skills Match</div>
<div className="flex flex-wrap gap-2">
<span className="px-2 py-1 bg-surface-variant text-primary rounded text-xs font-medium">React</span>
<span className="px-2 py-1 bg-surface-variant text-primary rounded text-xs font-medium">Node.js</span>
<span className="px-2 py-1 border border-border-light text-text-slate rounded text-xs font-medium border-dashed">AWS (Missing)</span>
</div>
</div>
<button className="w-full py-2 bg-white border border-primary text-primary rounded-lg font-button-text text-button-text hover:bg-primary/5 transition-colors">Apply Now</button>
</div>

<div className="bg-white border border-border-light rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative">
<div className="absolute top-4 right-4 bg-tertiary-container/10 text-tertiary-container px-2 py-1 rounded-full font-label-caps text-label-caps flex items-center gap-1">
<span className="material-symbols-outlined text-[14px]">check_circle</span> 88% Match
                                </div>
<div className="w-12 h-12 bg-surface-container-low rounded-lg flex items-center justify-center mb-4 text-secondary-container">
<span className="material-symbols-outlined">data_usage</span>
</div>
<h3 className="font-body-lg text-body-lg font-bold text-on-surface mb-1">Data Analyst Intern</h3>
<p className="font-body-md text-body-md text-on-surface-variant text-sm mb-4">Quantus Fin • On-site</p>
<div className="mb-4">
<div className="font-label-caps text-label-caps text-text-slate mb-2">Skills Match</div>
<div className="flex flex-wrap gap-2">
<span className="px-2 py-1 bg-surface-variant text-primary rounded text-xs font-medium">Python</span>
<span className="px-2 py-1 bg-surface-variant text-primary rounded text-xs font-medium">SQL</span>
<span className="px-2 py-1 bg-surface-variant text-primary rounded text-xs font-medium">Tableau</span>
</div>
</div>
<button className="w-full py-2 bg-white border border-primary text-primary rounded-lg font-button-text text-button-text hover:bg-primary/5 transition-colors">Apply Now</button>
</div>
</div>
</section>

<div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">

<section>
<h2 className="font-headline-md text-headline-md text-on-surface mb-6">Recent Activity</h2>
<div className="relative border-l-2 border-border-light ml-3 space-y-6">
<div className="relative pl-6">
<div className="absolute w-3 h-3 bg-primary rounded-full -left-[7px] top-1.5 ring-4 ring-white"></div>
<p className="font-body-md text-body-md text-on-surface font-medium">Uploaded AWS Certificate</p>
<p className="font-label-caps text-label-caps text-text-slate mt-1">+15 Skill Points</p>
</div>
<div className="relative pl-6">
<div className="absolute w-3 h-3 bg-secondary-container rounded-full -left-[7px] top-1.5 ring-4 ring-white"></div>
<p className="font-body-md text-body-md text-on-surface font-medium">Joined Web3 Hackathon</p>
<p className="font-label-caps text-label-caps text-text-slate mt-1">Event Registration</p>
</div>
<div className="relative pl-6">
<div className="absolute w-3 h-3 bg-border-light rounded-full -left-[7px] top-1.5 ring-4 ring-white"></div>
<p className="font-body-md text-body-md text-on-surface font-medium">Completed Profile Section</p>
<p className="font-label-caps text-label-caps text-text-slate mt-1">2 days ago</p>
</div>
</div>
</section>

<section className="bg-white border border-border-light rounded-xl p-6 shadow-sm">
<div className="flex justify-between items-center mb-4">
<h2 className="font-body-lg text-body-lg font-bold text-on-surface">Top Students</h2>
<span className="material-symbols-outlined text-surface-tint">emoji_events</span>
</div>
<div className="space-y-4">
<div className="flex items-center justify-between">
<div className="flex items-center gap-3">
<div className="w-8 h-8 rounded-full bg-surface-variant flex items-center justify-center font-bold text-primary text-sm">1</div>
<div>
<div className="font-button-text text-button-text font-bold text-on-surface">Alex Mercer</div>
<div className="text-xs text-text-slate">Computer Science</div>
</div>
</div>
<div className="font-button-text text-button-text text-on-surface">920 pts</div>
</div>
<div className="flex items-center justify-between">
<div className="flex items-center gap-3">
<div className="w-8 h-8 rounded-full bg-surface-variant flex items-center justify-center font-bold text-on-surface-variant text-sm">2</div>
<div>
<div className="font-button-text text-button-text font-bold text-on-surface">Sarah Jenkins</div>
<div className="text-xs text-text-slate">Data Science</div>
</div>
</div>
<div className="font-button-text text-button-text text-on-surface">895 pts</div>
</div>
<div className="flex items-center justify-between">
<div className="flex items-center gap-3">
<div className="w-8 h-8 rounded-full bg-surface-variant flex items-center justify-center font-bold text-on-surface-variant text-sm">3</div>
<div>
<div className="font-button-text text-button-text font-bold text-on-surface">David Chen</div>
<div className="text-xs text-text-slate">Electronics</div>
</div>
</div>
<div className="font-button-text text-button-text text-on-surface">880 pts</div>
</div>
</div>
</section>
</div>
</div>
</div>
</div>

<footer className="bg-surface border-t border-border-light mt-12 w-full">
<div className="mx-auto px-gutter py-8 flex flex-col md:flex-row justify-between items-center gap-4">
<p className="font-body-md text-body-md text-on-surface-variant italic text-center md:text-left">"Every small step today is a giant leap for your career."</p>
<div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-border-light shadow-sm">
<span className="material-symbols-outlined text-orange-500">local_fire_department</span>
<span className="font-button-text text-button-text font-bold text-on-surface">12-Day Activity Streak</span>
</div>
</div>

<div className="grid grid-cols-1 md:grid-cols-4 gap-gutter px-gutter py-section-gap-mobile md:py-section-gap-desktop mx-auto border-t border-border-light mt-8">
<div>
<span className="font-headline-md text-headline-md font-bold text-on-surface block mb-4">Campus Connect</span>
<p className="font-body-md text-body-md text-on-surface-variant">© 2024 Campus Connect. Empowering the next generation of professionals.</p>
</div>
<div className="flex flex-col gap-2">
<a className="font-body-md text-body-md text-on-surface-variant hover:text-primary underline opacity-80 hover:opacity-100 transition-opacity" href="#">Students</a>
<a className="font-body-md text-body-md text-on-surface-variant hover:text-primary underline opacity-80 hover:opacity-100 transition-opacity" href="#">Colleges</a>
</div>
<div className="flex flex-col gap-2">
<a className="font-body-md text-body-md text-on-surface-variant hover:text-primary underline opacity-80 hover:opacity-100 transition-opacity" href="#">Privacy Policy</a>
<a className="font-body-md text-body-md text-on-surface-variant hover:text-primary underline opacity-80 hover:opacity-100 transition-opacity" href="#">Terms of Service</a>
</div>
<div className="flex flex-col gap-2">
<a className="font-body-md text-body-md text-on-surface-variant hover:text-primary underline opacity-80 hover:opacity-100 transition-opacity" href="#">Support</a>
<a className="font-body-md text-body-md text-on-surface-variant hover:text-primary underline opacity-80 hover:opacity-100 transition-opacity" href="#">LinkedIn</a>
<a className="font-body-md text-body-md text-on-surface-variant hover:text-primary underline opacity-80 hover:opacity-100 transition-opacity" href="#">GitHub</a>
<a className="font-body-md text-body-md text-on-surface-variant hover:text-primary underline opacity-80 hover:opacity-100 transition-opacity" href="#">Twitter</a>
</div>
</div>
</footer>
</main>

<nav className="md:hidden bg-white/80 backdrop-blur-xl fixed bottom-0 w-full flex justify-around items-center h-16 border-t border-border-light z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
<a className="flex flex-col items-center gap-1 text-primary" href="#">
<span className="material-symbols-outlined" >dashboard</span>
<span className="text-[10px] font-semibold">Dash</span>
</a>
<a className="flex flex-col items-center gap-1 text-on-surface-variant hover:text-primary" href="#">
<span className="material-symbols-outlined">work</span>
<span className="text-[10px] font-semibold">Jobs</span>
</a>
<a className="flex flex-col items-center gap-1 text-on-surface-variant hover:text-primary" href="#">
<span className="material-symbols-outlined">event</span>
<span className="text-[10px] font-semibold">Events</span>
</a>
<a className="flex flex-col items-center gap-1 text-on-surface-variant hover:text-primary" href="#">
<span className="material-symbols-outlined">person</span>
<span className="text-[10px] font-semibold">Profile</span>
</a>
</nav>


    </div>
  );
}
