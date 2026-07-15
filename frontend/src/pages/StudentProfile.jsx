import React from 'react';
import Sidebar from '../components/Sidebar';

export default function StudentProfile() {
  
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background text-on-surface font-body-lg">
      

<Sidebar />

<main className="flex-1 relative overflow-y-auto">

<header className="sticky top-0 w-full z-50 flex justify-between items-center px-gutter py-4 bg-surface/80 backdrop-blur-xl border-b border-outline-variant shadow-sm" id="topNav">
<div className="font-display-hero text-headline-md font-bold text-primary tracking-tight">LuminaProfile</div>
<nav className="hidden md:flex gap-6 font-body-md text-body-md">
<a className="text-primary font-semibold border-b-2 border-primary pb-1 cursor-pointer active:opacity-80" href="#">Portfolio</a>
<a className="text-on-surface-variant hover:text-primary transition-colors duration-200 cursor-pointer active:opacity-80" href="#">Analytics</a>
<a className="text-on-surface-variant hover:text-primary transition-colors duration-200 cursor-pointer active:opacity-80" href="#">Network</a>
<a className="text-on-surface-variant hover:text-primary transition-colors duration-200 cursor-pointer active:opacity-80" href="#">Resources</a>
</nav>
<div className="flex items-center gap-4">
<div className="hidden md:flex gap-3 text-on-surface-variant">
<span className="material-symbols-outlined cursor-pointer hover:text-primary transition-colors">notifications</span>
<span className="material-symbols-outlined cursor-pointer hover:text-primary transition-colors">settings</span>
</div>
<button className="hidden sm:block px-4 py-2 bg-primary text-on-primary font-button-text text-button-text rounded-lg hover:bg-primary-container transition-colors shadow-sm">Edit Profile</button>
<img className="w-8 h-8 rounded-full object-cover lg:hidden cursor-pointer shadow-sm" data-alt="A small circular avatar of a student for the top navigation bar. Clean, professional look, white background." src="https://lh3.googleusercontent.com/aida-public/AB6AXuA_ab3teuPsB4qKOWKhIerKLDyt47NFaTVePqc7AZhWgeIfQwW6UvjZCt3inokjZn-1VsTrlhGu2TrPHGbAMyzmdmLZse8utselwEbcuKoiMFJVxvAyN3n04CzZJ__gVy3k2J7ddq3R56j2v7rLQCa29-IRcgu83x4lThdG3RfB5MS3dYJr_GlplBNkPF_BA5BRrZjxT35VPfepEPo8OMLZ4H-704AQbncZDl4qrnnFU0ZADmVCqdMiYmp0q8hDSIVI03agzwHa5vQG" />
</div>
</header>
<div className="pt-24 pb-section-gap-mobile md:pb-section-gap-desktop px-gutter max-w-container-max mx-auto w-full">

<section className="relative mb-16 mt-4">
<div className="w-full h-48 md:h-64 rounded-xl overflow-hidden relative shadow-md" data-alt="A striking abstract digital background featuring geometric shapes and subtle glowing lines in shades of deep indigo, soft blue, and clean white. The style is modern, minimalist, and technological, representing academic growth and scalable systems. The lighting is bright and airy, evoking a premium SaaS application interface." >
<div className="absolute inset-0 bg-gradient-to-b from-transparent to-surface-container/50"></div>
</div>
<div className="relative px-6 md:px-12 -mt-16 md:-mt-20 flex flex-col md:flex-row items-start md:items-end gap-6 pb-6">
<div className="relative p-1 bg-surface-container-lowest rounded-full shadow-ambient">
<img className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-surface-container-lowest" data-alt="A high-quality, professional circular profile portrait of a male engineering student named Tarun. He is smiling confidently, dressed in smart-casual attire. The background is a soft, blurred bright gray. The image feels authentic, trustworthy, and suited for a premium digital portfolio." src="https://lh3.googleusercontent.com/aida-public/AB6AXuANyjpB7G7Hz6VLOw4gukAuqpGbKkns0aI9z7IeGi2yk7PpCtajYUoY3pr8yADOg-FpNg4F_rO-rjuuR6mM_LE9jZGlxR7p8KddVi22WEUl-k4SmGpYCIeWRK2lJJs3uLJnGGISwlHeZWq6AAeKGvXCQJYwLkX36rmxY2gCwjRlEIXMxyycO54HQWZFbUG77oYb82AyNH_nyRYt9-X6M_p_1bzOLmyPPdmzDAXZ_r4cG1pg0DCQcpIVAFmi0N4Pd-FGwtzApF2Fs3iu" />
<div className="absolute bottom-2 right-2 w-5 h-5 bg-tertiary-fixed rounded-full border-2 border-surface-container-lowest flex items-center justify-center shadow-sm" title="Verified Student">
<span className="material-symbols-outlined text-[12px] text-on-tertiary-fixed">check</span>
</div>
</div>
<div className="flex-1">
<div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
<div>
<h1 className="font-display-hero text-headline-lg-mobile md:text-headline-lg text-on-surface mb-1">Tarun</h1>
<p className="font-body-md text-body-lg text-on-surface-variant flex items-center gap-2">
<span className="material-symbols-outlined text-outline text-[18px]">school</span>
                                    Computer Science &amp; Engineering • 3rd Year
                                </p>
</div>
<div className="flex gap-3 mt-4 md:mt-0">
<button className="px-5 py-2.5 bg-bg-subtle border border-border-light text-on-surface font-button-text text-button-text rounded-lg hover:bg-surface-container-high transition-colors shadow-sm flex items-center gap-2">
<span className="material-symbols-outlined text-[18px]">share</span> Share
                                </button>
<button className="px-5 py-2.5 bg-primary text-on-primary font-button-text text-button-text rounded-lg hover:bg-primary-container transition-colors shadow-ambient flex items-center gap-2">
<span className="material-symbols-outlined text-[18px]">download</span> Resume
                                </button>
</div>
</div>
</div>
</div>
<div className="px-6 md:px-12 grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 border-t border-border-light pt-8">
<div className="col-span-1 md:col-span-2">
<p className="font-body-md text-body-md text-on-surface-variant leading-relaxed max-w-2xl">
                            Aspiring Software Engineer passionate about AI and Full-stack development. Focused on building scalable systems and exploring the intersection of machine learning and web architecture.
                        </p>
</div>
<div className="flex flex-col gap-3 md:items-end">
<div className="flex items-center gap-2 font-label-caps text-label-caps text-on-surface">
<span className="material-symbols-outlined text-outline">account_balance</span>
                            National Institute of Technology
                        </div>
<div className="flex items-center gap-2 font-label-caps text-label-caps text-on-surface">
<span className="material-symbols-outlined text-outline">grade</span>
                            CGPA: <span className="text-primary font-bold">3.85/4.0</span>
</div>
</div>
</div>
</section>

<div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

<div className="xl:col-span-1 flex flex-col gap-8">

<div className="bg-surface-container-lowest rounded-xl p-6 border border-border-light shadow-ambient">
<div className="flex justify-between items-center mb-4">
<h3 className="font-headline-md text-body-lg font-semibold text-on-surface flex items-center gap-2">
<span className="material-symbols-outlined text-primary">donut_large</span> Profile Status
                            </h3>
<span className="font-label-caps text-label-caps text-primary">85% Complete</span>
</div>
<div className="w-full bg-surface-container-high rounded-full h-2 mb-4 overflow-hidden">
<div className="bg-primary h-2 rounded-full w-[85%]"></div>
</div>
<div className="bg-surface-container-low p-3 rounded-lg border border-surface-variant flex justify-between items-center">
<span className="font-body-md text-[14px] text-on-surface-variant">Add Research Papers</span>
<button className="text-primary hover:text-primary-container transition-colors">
<span className="material-symbols-outlined text-[18px]">add_circle</span>
</button>
</div>
</div>

<div className="bg-surface-container-lowest rounded-xl p-6 border border-border-light shadow-ambient relative overflow-hidden">
<div className="absolute top-0 right-0 w-32 h-32 bg-ai-gradient-start rounded-bl-full opacity-50 pointer-events-none"></div>
<h3 className="font-headline-md text-body-lg font-semibold text-on-surface mb-6 flex items-center gap-2">
<span className="material-symbols-outlined text-outline">menu_book</span> Academic Snapshot
                        </h3>
<div className="space-y-4">
<div className="flex justify-between items-center pb-3 border-b border-surface-variant">
<span className="font-body-md text-on-surface-variant">Institution</span>
<span className="font-button-text text-on-surface text-right">NIT</span>
</div>
<div className="flex justify-between items-center pb-3 border-b border-surface-variant">
<span className="font-body-md text-on-surface-variant">Semester</span>
<span className="font-button-text text-on-surface">6th (Current)</span>
</div>
<div className="flex justify-between items-center pb-3 border-b border-surface-variant">
<span className="font-body-md text-on-surface-variant">Backlogs</span>
<span className="font-button-text text-tertiary px-2 py-0.5 bg-tertiary-fixed rounded-full text-[12px]">0 Active</span>
</div>
<div className="flex justify-between items-center">
<span className="font-body-md text-on-surface-variant">Graduation</span>
<span className="font-button-text text-on-surface">May 2026</span>
</div>
</div>
</div>
</div>

<div className="xl:col-span-2 flex flex-col gap-8">

<div className="bg-surface-container-lowest rounded-xl p-6 md:p-8 border border-border-light shadow-ambient">
<div className="flex justify-between items-end mb-6">
<h3 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2">
<span className="material-symbols-outlined text-primary">rocket_launch</span> Featured Projects
                            </h3>
<a className="font-button-text text-[14px] text-primary hover:underline flex items-center gap-1" href="#">View All <span className="material-symbols-outlined text-[16px]">arrow_forward</span></a>
</div>
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">

<div className="group border border-border-light rounded-lg p-5 hover:border-primary transition-colors bg-bg-subtle cursor-pointer">
<div className="flex justify-between items-start mb-3">
<h4 className="font-body-md font-semibold text-on-surface">AI Career Coach</h4>
<div className="flex gap-2 text-outline group-hover:text-primary transition-colors">
<span className="material-symbols-outlined text-[20px]">code</span>
<span className="material-symbols-outlined text-[20px]">open_in_new</span>
</div>
</div>
<p className="font-body-md text-[14px] text-on-surface-variant mb-4 line-clamp-2">An intelligent platform providing personalized career advice using natural language processing.</p>
<div className="flex gap-2">
<span className="px-2 py-1 bg-surface-container-highest text-on-surface-variant rounded font-label-caps text-[10px]">React</span>
<span className="px-2 py-1 bg-surface-container-highest text-on-surface-variant rounded font-label-caps text-[10px]">FastAPI</span>
</div>
</div>

<div className="group border border-border-light rounded-lg p-5 hover:border-primary transition-colors bg-bg-subtle cursor-pointer">
<div className="flex justify-between items-start mb-3">
<h4 className="font-body-md font-semibold text-on-surface">Decentralized Voting</h4>
<div className="flex gap-2 text-outline group-hover:text-primary transition-colors">
<span className="material-symbols-outlined text-[20px]">code</span>
</div>
</div>
<p className="font-body-md text-[14px] text-on-surface-variant mb-4 line-clamp-2">A secure, transparent blockchain-based voting system built with smart contracts.</p>
<div className="flex gap-2">
<span className="px-2 py-1 bg-surface-container-highest text-on-surface-variant rounded font-label-caps text-[10px]">Solidity</span>
<span className="px-2 py-1 bg-surface-container-highest text-on-surface-variant rounded font-label-caps text-[10px]">Web3.js</span>
</div>
</div>
</div>
</div>
</div>
</div>
</div>

<footer className="w-full border-t border-outline-variant bg-surface-container-lowest mt-section-gap-desktop py-12 px-gutter">
<div className="max-w-container-max mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
<div className="font-display-hero text-headline-md text-primary tracking-tight">LuminaProfile</div>
<div className="flex gap-6 font-body-md text-body-md">
<a className="text-on-surface-variant hover:text-primary transition-colors" href="#">Privacy Policy</a>
<a className="text-on-surface-variant hover:text-primary transition-colors" href="#">Terms of Service</a>
<a className="text-on-surface-variant hover:text-primary transition-colors" href="#">API Documentation</a>
<a className="text-on-surface-variant hover:text-primary transition-colors" href="#">Contact Support</a>
</div>
<div className="font-body-md text-body-md text-on-surface-variant">
                    © 2024 Lumina Academic Systems. All rights reserved.
                </div>
</div>
</footer>
</main>
{/* Inline script removed */}

    </div>
  );
}
