import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import ReactionButtons from './ReactionButtons';
import {
  FiBriefcase,
  FiAward,
  FiPaperclip,
  FiExternalLink,
  FiClock,
  FiMapPin,
  FiDollarSign,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle
} from 'react-icons/fi';

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
      case 'interview_experience': return 'Interview Experience';
      case 'assessment_experience': return 'Online Assessment';
      case 'offer_received': return 'Offer Received';
      case 'rejection_experience': return 'Rejection & Learnings';
      case 'referral_share': return 'Referral Share';
      case 'tips_and_advice': return 'Prep Guide / Tips';
      default: return 'Experience';
    }
  };

  const getDifficultyBadge = (diff) => {
    switch (diff) {
      case 'easy':
        return <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 font-bold text-[11px] border border-emerald-500/20">Easy</span>;
      case 'medium':
        return <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 font-bold text-[11px] border border-amber-500/20">Medium</span>;
      case 'hard':
        return <span className="px-2 py-0.5 rounded-md bg-orange-500/10 text-orange-600 font-bold text-[11px] border border-orange-500/20">Hard</span>;
      case 'very_hard':
        return <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 font-bold text-[11px] border border-rose-500/20">Very Hard</span>;
      default:
        return null;
    }
  };

  const getOutcomeBadge = (outcome) => {
    switch (outcome) {
      case 'selected':
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-green-500/15 text-green-700 font-bold text-[11px] border border-green-500/30">
            <FiCheckCircle className="text-xs" /> Selected
          </span>
        );
      case 'rejected':
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-red-500/10 text-red-600 font-bold text-[11px] border border-red-500/20">
            <FiXCircle className="text-xs" /> Rejected
          </span>
        );
      case 'waitlisted':
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-amber-500/10 text-amber-600 font-bold text-[11px] border border-amber-500/20">
            <FiAlertCircle className="text-xs" /> Waitlisted
          </span>
        );
      case 'in_process':
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-blue-500/10 text-blue-600 font-bold text-[11px] border border-blue-500/20">
            <FiClock className="text-xs" /> In Process
          </span>
        );
      default:
        return null;
    }
  };

  // Helper to extract plain text snippet from rich HTML
  const getPlainTextSnippet = (html, length = 220) => {
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
      className="group relative bg-surface-container-lowest border border-border-light hover:border-primary/40 rounded-2xl p-5 md:p-6 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer"
    >
      {/* Header: Company Info + Outcome/Difficulty */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Company Logo */}
          <div className="w-11 h-11 rounded-xl bg-surface-container-low border border-border-light p-1.5 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform overflow-hidden">
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
              className="w-full h-full rounded-lg bg-gradient-to-br from-primary-container to-secondary-container text-on-primary-container items-center justify-center font-bold text-base"
            >
              {fallbackInitial}
            </div>
          </div>

          {/* Company & Role */}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-base text-on-surface group-hover:text-primary transition-colors truncate">
                {post.company?.name}
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                {getPostTypeLabel(post.postType)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-on-surface-variant font-medium mt-0.5 flex-wrap">
              <span className="font-semibold text-on-surface">{post.role}</span>
              {post.location && (
                <span className="flex items-center gap-0.5 text-[11px]">
                  • <FiMapPin className="text-[10px]" /> {post.location}
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
      <div className="flex items-center gap-2 flex-wrap mb-3 text-xs">
        {formatSalary(post.salary) && (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 font-bold border border-emerald-500/20">
            <FiDollarSign className="text-xs" />
            {formatSalary(post.salary)}
          </span>
        )}

        {post.numberOfRounds && (
          <span className="px-2.5 py-1 rounded-lg bg-surface-container-low text-on-surface-variant font-semibold border border-border-light">
            {post.numberOfRounds} {post.numberOfRounds === 1 ? 'Round' : 'Rounds'}
          </span>
        )}

        {post.assessmentType && (
          <span className="px-2.5 py-1 rounded-lg bg-surface-container-low text-on-surface-variant font-medium border border-border-light capitalize">
            {post.assessmentType.replace('_', ' ')}
          </span>
        )}

        {post.interviewType && (
          <span className="px-2.5 py-1 rounded-lg bg-surface-container-low text-on-surface-variant font-medium border border-border-light capitalize">
            {post.interviewType.replace('_', ' ')} Interview
          </span>
        )}

        {post.jobType && (
          <span className="px-2.5 py-1 rounded-lg bg-surface-container-low text-on-surface-variant font-medium border border-border-light capitalize">
            {post.jobType.replace('_', ' ')}
          </span>
        )}
      </div>

      {/* Post Title */}
      <h2 className="text-base md:text-lg font-bold text-on-surface mb-2 leading-snug group-hover:text-primary transition-colors">
        {post.title}
      </h2>

      {/* Content Preview Snippet */}
      <p className="text-sm text-on-surface-variant leading-relaxed mb-4 line-clamp-3">
        {getPlainTextSnippet(post.content)}
      </p>

      {/* Images Preview / Attachment Badge */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        {post.images && post.images.length > 0 && (
          <div className="flex items-center gap-1.5">
            {post.images.slice(0, 3).map((img, i) => (
              <img
                key={i}
                src={img}
                alt="preview"
                className="w-12 h-12 rounded-lg object-cover border border-border-light shadow-2xs"
              />
            ))}
            {post.images.length > 3 && (
              <span className="w-12 h-12 rounded-lg bg-surface-variant text-on-surface-variant font-bold text-xs flex items-center justify-center border border-border-light">
                +{post.images.length - 3}
              </span>
            )}
          </div>
        )}

        {post.attachmentUrl && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-low border border-border-light text-xs font-semibold text-on-surface-variant">
            <FiPaperclip className="text-primary text-sm" />
            <span className="truncate max-w-[140px]">{post.attachmentName || 'Attachment'}</span>
          </div>
        )}
      </div>

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap mb-4">
          {post.tags.slice(0, 5).map((t, idx) => (
            <span
              key={idx}
              className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-surface-variant/60 text-on-surface-variant hover:text-primary transition-colors"
            >
              #{t}
            </span>
          ))}
        </div>
      )}

      {/* Author Bar */}
      <div className="flex items-center justify-between gap-2 pb-3 mb-1 text-xs text-on-surface-variant">
        <Link
          to={post.author?._id ? `/profile` : '#'}
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-2 group/author hover:text-primary transition-colors"
        >
          <div className="w-6 h-6 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-[10px] shrink-0 overflow-hidden shadow-2xs">
            {authorAvatar ? (
              <img src={authorAvatar} alt={authorName} className="w-full h-full object-cover" />
            ) : (
              authorName.charAt(0).toUpperCase()
            )}
          </div>
          <span className="font-bold text-on-surface group-hover/author:text-primary transition-colors">
            {authorName}
          </span>
          {(authorBranch || authorGrad) && (
            <span className="text-[11px] text-on-surface-variant">
              • {authorBranch} {authorGrad ? `'${authorGrad.slice(-2)}` : ''}
            </span>
          )}
        </Link>

        <span className="text-[11px] text-on-surface-variant/70 font-mono">
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
    </article>
  );
}
