import React from 'react';
import { Camera, Edit3, Share2, FileText, Plus, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ProfileHeader({
  profile,
  education,
  uploadingAvatar,
  handleAvatarUpload,
  setShowEditor,
  handleShareProfile,
  setShowPdf
}) {
  return (
    <section className="rounded-xl border border-gray-400 bg-background-200 p-6 shadow-2xs space-y-6">
      <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6">

        {/* Avatar & Core Metadata */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">

          {/* Avatar with Camera Trigger */}
          <div className="relative group w-24 h-24 rounded-full bg-gray-300 dark:bg-gray-800 border-2 border-gray-400 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover" />
            ) : (
              <span className="font-semibold text-gray-700 text-xl font-mono">
                {profile.name?.slice(0, 2).toUpperCase() || 'ST'}
              </span>
            )}
            {uploadingAvatar && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              </div>
            )}
            {!uploadingAvatar && (
              <label className="absolute inset-0 bg-black/60 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity z-10">
                <Camera className="w-5 h-5" strokeWidth={1.5} />
                <span className="text-[10px] font-mono mt-0.5">Upload</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </label>
            )}
          </div>

          {/* Name, Email, Institution */}
          <div className="space-y-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-xl font-semibold text-gray-1000 tracking-tight">{profile.name}</h1>
              {profile.uid && (
                <span className="px-2 py-0.5 rounded-full bg-background-100 border border-gray-400 text-[10px] font-mono text-gray-700">
                  {profile.uid}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-700 font-mono">{profile.email}</p>
            <p className="text-xs text-gray-600 font-sans pt-0.5">
              {education.length > 0 ? `${education[0].degree} · ${education[0].institution}` : 'Campus Connect Student'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-end">
          <button
            type="button"
            onClick={() => setShowEditor(true)}
            className="h-8 px-3 rounded-md bg-gray-1000 text-background-100 hover:opacity-90 text-xs font-medium transition-opacity flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Edit3 className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>Edit Resume</span>
          </button>
          
          <Link
            to={`/student/${profile.uid}`}
            target="_blank"
            rel="noreferrer"
            className="h-8 px-3 rounded-md border border-gray-400 bg-background-100 hover:bg-gray-200 text-xs font-medium text-gray-900 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span>View Public Profile</span>
          </Link>

          <button
            type="button"
            onClick={handleShareProfile}
            className="h-8 px-3 rounded-md border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-xs font-medium text-emerald-700 dark:text-emerald-400 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>Share Profile</span>
          </button>
          {profile.resumeUrl && (
            <button
              type="button"
              onClick={() => setShowPdf(true)}
              className="h-8 px-3 rounded-md border border-gray-400 bg-background-100 hover:bg-gray-200 text-xs font-medium text-gray-900 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>View PDF</span>
            </button>
          )}
          <Link
            to="/placements/create"
            className="h-8 px-3 rounded-md border border-gray-400 bg-background-100 hover:bg-gray-200 text-xs font-medium text-gray-900 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>Share Experience</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
