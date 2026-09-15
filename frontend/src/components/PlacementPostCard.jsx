import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import ReactionButtons from './ReactionButtons';
import {
  Building2,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Paperclip,
  IndianRupee
} from 'lucide-react';

export default function PlacementPostCard({ post }) {
  const navigate = useNavigate();

  const handleCardClick = (e) => {
    // Avoid triggering card navigation if user clicked a link or interactive button inside
    if (e.target.closest('button') || e.target.closest('a')) {
      return;
    }
    navigate(`/placements/${post._id}`);
  };

  const getPostTypeLabel = (type) => {
    switch (type) {
      case 'interview_experience': return 'Interview';
      case 'assessment_experience': return 'Online Assessment';
      case 'offer_received': return 'Offer Received';
      case 'rejection_experience': return 'Rejection & Learnings';
      case 'referral_share': return 'Referral';
      case 'tips_and_advice': return 'Prep Guide';
      default: return 'Experience';
    }
  };

  const getDifficultyBadge = (diff) => {
    switch (diff) {
      case 'easy':
        return <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] border border-emerald-500/20">Easy</span>;
      case 'medium':
        return <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono text-[10px] border border-amber-500/20">Medium</span>;
      case 'hard':
        return <span className="px-2 py-0.5 rounded bg-orange-500/10 text-orange-600 dark:text-orange-400 font-mono text-[10px] border border-orange-500/20">Hard</span>;
      case 'very_hard':
        return <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 font-mono text-[10px] border border-rose-500/20">Very Hard</span>;
      default:
        return null;
    }
  };

  const getOutcomeBadge = (outcome) => {
    switch (outcome) {
      case 'selected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-medium border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" /> Selected
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-500/10 text-red-600 dark:text-red-400 font-mono text-[10px] font-medium border border-red-500/20">
            <XCircle className="w-3 h-3" /> Rejected
          </span>
        );
      case 'waitlisted':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono text-[10px] font-medium border border-amber-500/20">
            <AlertCircle className="w-3 h-3" /> Waitlisted
          </span>
        );
      case 'in_process':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-mono text-[10px] font-medium border border-blue-500/20">
            <Clock className="w-3 h-3" /> In Process
          </span>
        );
      default:
        return null;
    }
  };

  // Helper to extract plain text snippet from rich HTML
  const getPlainTextSnippet = (html, length = 200) => {
    if (!html) return '';
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    const text = tmp.textContent || tmp.innerText || '';
    return text.length > length ? text.substring(0, length) + '...' : text;
  };

  const formatSalary = (salary) => {
    if (!salary || !salary.amount) return null;
    const amt = Number(salary.amount);
    if (salary.period === 'stipend_per_month' || salary.period === 'monthly') {
      return `₹${amt >= 1000 ? `${(amt / 1000).toFixed(0)}k` : amt}/mo`;
    }
    // Annual
    if (amt >= 100000) {
      return `₹${(amt / 100000).toFixed(1)} LPA`;
    }
    return `₹${amt.toLocaleString()}`;
  };

  const authorName = post.author?.name || 'Student';
  const authorAvatar = post.author?.avatarUrl;
  const authorBranch = post.branch || post.author?.branch;
  const authorGrad = post.graduationYear || post.author?.graduationYear;

  const fallbackInitial = (post.company?.name || 'C').charAt(0).toUpperCase();

  return (
    <article
      onClick={handleCardClick}
      className="group relative isolate bg-background-100 border border-gray-400 hover:border-gray-900/40 rounded-xl p-5 shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer text-gray-1000 overflow-hidden flex flex-col"
    >
      {/* Top Left Color Leak Effect from Logo */}
      {post.company?.logoUrl ? (
        <div 
          className="absolute -top-24 -left-24 w-72 h-72 pointer-events-none z-0 transition-all duration-500 opacity-30 dark:opacity-15 group-hover:opacity-50 dark:group-hover:opacity-30 group-hover:scale-125 mix-blend-multiply dark:mix-blend-plus-lighter"
          style={{
            backgroundImage: `url(${post.company.logoUrl})`,
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            filter: 'blur(55px) saturate(250%)'
          }}
        />
      ) : (
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-gray-400/30 dark:bg-gray-400/10 blur-[55px] rounded-full pointer-events-none z-0 transition-all duration-500 group-hover:bg-gray-400/40 dark:group-hover:bg-gray-400/20 group-hover:scale-125" />
      )}

      {/* Fading Border Glow on Top Left */}
      <div 
        className="absolute inset-0 rounded-xl pointer-events-none z-20 transition-opacity duration-500 opacity-60 dark:opacity-40 group-hover:opacity-100 border-t-[1.5px] border-l-[1.5px] border-gray-400 dark:border-white/40"
        style={{
          WebkitMaskImage: 'radial-gradient(circle at top left, black 0%, transparent 60%)',
          maskImage: 'radial-gradient(circle at top left, black 0%, transparent 60%)'
        }}
      />

      <div className="relative z-10 flex flex-col flex-1">
        {/* Header: Company Info + Outcome/Difficulty */}
        <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Company Logo */}
          <div className="w-10 h-10 rounded-lg bg-background-200 border border-gray-400 p-1 flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">
            {post.company?.logoUrl ? (
              <img
                src={post.company.logoUrl}
                alt={post.company.name}
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.style.display = 'none';
                  if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div
              style={{ display: post.company?.logoUrl ? 'none' : 'flex' }}
              className="w-full h-full rounded bg-background-100 text-gray-900 items-center justify-center font-bold text-sm"
            >
              {fallbackInitial}
            </div>
          </div>

          {/* Company & Role */}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-sm text-gray-1000 group-hover:text-gray-900 transition-colors truncate">
                {post.company?.name}
              </h3>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono text-gray-600 bg-background-200 border border-gray-400 uppercase tracking-wider">
                {getPostTypeLabel(post.postType)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-700 font-sans mt-0.5 flex-wrap">
              <span className="font-medium text-gray-900">{post.role}</span>
              {post.location && (
                <span className="flex items-center gap-0.5 text-[11px] text-gray-600">
                  • <MapPin className="w-3 h-3 text-gray-500" /> {post.location}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Outcome & Difficulty Badges */}
        <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
          {getOutcomeBadge(post.outcome)}
          {getDifficultyBadge(post.difficulty)}
        </div>
      </div>

      {/* Meta Pills (Salary, Rounds, Mode) */}
      <div className="flex items-center gap-1.5 flex-wrap mb-3 text-xs">
        {formatSalary(post.salary) && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-mono text-xs font-medium border border-emerald-500/20">
            <IndianRupee className="w-3 h-3" />
            {formatSalary(post.salary)}
          </span>
        )}

        {post.numberOfRounds && (
          <span className="px-2 py-0.5 rounded bg-background-200 border border-gray-400 text-gray-700 font-mono text-[11px]">
            {post.numberOfRounds} {post.numberOfRounds === 1 ? 'Round' : 'Rounds'}
          </span>
        )}

        {post.assessmentTypes?.length > 0 ? (
          post.assessmentTypes.slice(0, 2).map((t, idx) => (
            <span key={`a-${idx}`} className="px-2 py-0.5 rounded bg-background-200 border border-gray-400 text-gray-700 font-sans text-[11px] capitalize">
              {t.replace(/_/g, ' ')}
            </span>
          ))
        ) : post.assessmentType ? (
          <span className="px-2 py-0.5 rounded bg-background-200 border border-gray-400 text-gray-700 font-sans text-[11px] capitalize">
            {post.assessmentType.replace(/_/g, ' ')}
          </span>
        ) : null}

        {post.interviewTypes?.length > 0 ? (
          post.interviewTypes.slice(0, 2).map((t, idx) => (
            <span key={`i-${idx}`} className="px-2 py-0.5 rounded bg-background-200 border border-gray-400 text-gray-700 font-sans text-[11px] capitalize">
              {t.replace(/_/g, ' ')}
            </span>
          ))
        ) : post.interviewType ? (
          <span className="px-2 py-0.5 rounded bg-background-200 border border-gray-400 text-gray-700 font-sans text-[11px] capitalize">
            {post.interviewType.replace(/_/g, ' ')}
          </span>
        ) : null}

        {post.jobType && (
          <span className="px-2 py-0.5 rounded bg-background-200 border border-gray-400 text-gray-700 font-sans text-[11px] capitalize">
            {post.jobType.replace('_', ' ')}
          </span>
        )}
      </div>

      {/* Post Title */}
      <h2 className="text-sm sm:text-base font-semibold text-gray-1000 mb-1.5 leading-snug group-hover:text-gray-900 transition-colors">
        {post.title}
      </h2>

      {/* Content Preview Snippet */}
      <p className="text-xs sm:text-[13px] text-gray-700 font-sans leading-relaxed mb-3 line-clamp-2 sm:line-clamp-3">
        {getPlainTextSnippet(post.content)}
      </p>

      {/* Images Preview / Attachment Badge */}
      {(post.images?.length > 0 || post.attachmentUrl) && (
        <div className="flex items-center gap-2.5 mb-3 flex-wrap">
          {post.images && post.images.length > 0 && (
            <div className="flex items-center gap-1.5">
              {post.images.slice(0, 3).map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt="preview"
                  className="w-10 h-10 rounded-lg object-cover border border-gray-400 shadow-2xs"
                />
              ))}
              {post.images.length > 3 && (
                <span className="w-10 h-10 rounded-lg bg-background-200 border border-gray-400 text-gray-700 font-mono text-xs flex items-center justify-center">
                  +{post.images.length - 3}
                </span>
              )}
            </div>
          )}

          {post.attachmentUrl && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-background-200 border border-gray-400 text-[11px] font-mono text-gray-700">
              <Paperclip className="w-3 h-3 text-gray-600" />
              <span className="truncate max-w-[130px]">{post.attachmentName || 'Attachment'}</span>
            </div>
          )}
        </div>
      )}

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap mb-3">
          {post.tags.slice(0, 4).map((t, idx) => (
            <span
              key={idx}
              className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-background-200 text-gray-700 border border-gray-400"
            >
              #{t}
            </span>
          ))}
        </div>
      )}

      {/* Author Bar */}
      <div className="flex items-center justify-between gap-2 pb-2.5 mb-1 text-xs text-gray-700">
        <Link
          to={post.author?._id ? `/profile` : '#'}
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-2 group/author hover:text-gray-1000 transition-colors"
        >
          <div className="w-5 h-5 rounded-full bg-background-200 border border-gray-400 text-gray-900 flex items-center justify-center font-bold text-[9px] shrink-0 overflow-hidden shadow-2xs">
            {authorAvatar ? (
              <img src={authorAvatar} alt={authorName} className="w-full h-full object-cover" />
            ) : (
              authorName.charAt(0).toUpperCase()
            )}
          </div>
          <span className="font-medium text-gray-900 group-hover/author:underline">
            {authorName}
          </span>
          {(authorBranch || authorGrad) && (
            <span className="text-[11px] text-gray-600 font-sans">
              • {authorBranch} {authorGrad ? `'${authorGrad.slice(-2)}` : ''}
            </span>
          )}
        </Link>

        <span className="text-[11px] text-gray-600 font-mono">
          {post.createdAt ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }) : ''}
        </span>
      </div>

      {/* Interactive Reactions Bar */}
      <ReactionButtons
        postId={post._id}
        initialReactions={post.reactionCounts}
        totalReactions={post.totalReactions}
        initialMyReaction={post.myReactionType}
        initialBookmarked={post.isBookmarkedByMe}
        commentCount={post.commentCount || 0}
        onCommentClick={() => navigate(`/placements/${post._id}`)}
        compact={true}
      />
      </div>
    </article>
  );
}
