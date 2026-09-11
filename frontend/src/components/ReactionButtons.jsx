import React, { useState } from 'react';
import axios from 'axios';
import { FiThumbsUp, FiZap, FiAward, FiStar, FiBookmark, FiShare2, FiMessageSquare } from 'react-icons/fi';
import { useToast } from '../context/ToastContext';

export default function ReactionButtons({
  postId,
  initialReactions = {},
  totalReactions = 0,
  initialMyReaction = null,
  initialBookmarked = false,
  commentCount = 0,
  onCommentClick,
  compact = false
}) {
  const { showToast } = useToast();
  const [reactionCounts, setReactionCounts] = useState(initialReactions);
  const [myReaction, setMyReaction] = useState(initialMyReaction);
  const [total, setTotal] = useState(totalReactions);
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked);
  const [loadingReaction, setLoadingReaction] = useState(false);
  const [loadingBookmark, setLoadingBookmark] = useState(false);

  const reactionConfig = [
    {
      id: 'helpful',
      label: 'Helpful',
      icon: FiAward,
      activeColor: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/30',
      hoverColor: 'hover:text-emerald-600 hover:bg-emerald-500/5'
    },
    {
      id: 'insightful',
      label: 'Insightful',
      icon: FiZap,
      activeColor: 'text-amber-600 bg-amber-500/10 border-amber-500/30',
      hoverColor: 'hover:text-amber-600 hover:bg-amber-500/5'
    },
    {
      id: 'celebrate',
      label: 'Celebrate',
      icon: FiStar,
      activeColor: 'text-purple-600 bg-purple-500/10 border-purple-500/30',
      hoverColor: 'hover:text-purple-600 hover:bg-purple-500/5'
    },
    {
      id: 'like',
      label: 'Like',
      icon: FiThumbsUp,
      activeColor: 'text-primary bg-primary/10 border-primary/30',
      hoverColor: 'hover:text-primary hover:bg-primary/5'
    }
  ];

  const handleToggleReaction = async (type) => {
    if (loadingReaction) return;
    try {
      setLoadingReaction(true);
      const res = await axios.post(`/placements/${postId}/react`, { type });
      setMyReaction(res.data.myReactionType);
      setReactionCounts(res.data.reactionCounts || {});
      setTotal(res.data.totalReactions || 0);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update reaction', 'error');
    } finally {
      setLoadingReaction(false);
    }
  };

  const handleToggleBookmark = async () => {
    if (loadingBookmark) return;
    try {
      setLoadingBookmark(true);
      const res = await axios.post(`/placements/${postId}/bookmark`);
      setIsBookmarked(res.data.isBookmarkedByMe);
      showToast(res.data.message, 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to bookmark', 'error');
    } finally {
      setLoadingBookmark(false);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/placements/${postId}`;
    try {
      await navigator.clipboard.writeText(url);
      showToast('Post link copied to clipboard!', 'success');
    } catch (err) {
      showToast('Failed to copy link', 'error');
    }
  };

  if (compact) {
    // Compact View for Feed Cards
    return (
      <div className="flex items-center justify-between pt-3 border-t border-border-light text-on-surface-variant text-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          {reactionConfig.map((r) => {
            const Icon = r.icon;
            const count = reactionCounts[r.id] || 0;
            const isActive = myReaction === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleReaction(r.id);
                }}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                  isActive
                    ? r.activeColor
                    : `border-transparent bg-surface-container-low text-on-surface-variant ${r.hoverColor}`
                }`}
                title={r.label}
              >
                <Icon className={`text-sm ${isActive ? 'scale-110' : ''}`} />
                {count > 0 && <span>{count}</span>}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          {onCommentClick && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onCommentClick();
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-surface-variant text-on-surface-variant font-medium transition-colors"
            >
              <FiMessageSquare className="text-sm" />
              <span>{commentCount}</span>
            </button>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleToggleBookmark();
            }}
            className={`p-1.5 rounded-lg transition-colors ${
              isBookmarked
                ? 'text-primary bg-primary/10 font-bold'
                : 'hover:bg-surface-variant text-on-surface-variant hover:text-on-surface'
            }`}
            title={isBookmarked ? 'Saved' : 'Save post'}
          >
            <FiBookmark className={`text-sm ${isBookmarked ? 'fill-current' : ''}`} />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleShare();
            }}
            className="p-1.5 rounded-lg hover:bg-surface-variant text-on-surface-variant hover:text-on-surface transition-colors"
            title="Share"
          >
            <FiShare2 className="text-sm" />
          </button>
        </div>
      </div>
    );
  }

  // Expanded View for Post Detail
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-surface-container-low border border-border-light">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mr-1">
          React:
        </span>
        {reactionConfig.map((r) => {
          const Icon = r.icon;
          const count = reactionCounts[r.id] || 0;
          const isActive = myReaction === r.id;
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => handleToggleReaction(r.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-sm font-bold transition-all shadow-sm ${
                isActive
                  ? r.activeColor
                  : `border-border-light bg-surface-container-lowest text-on-surface ${r.hoverColor}`
              }`}
            >
              <Icon className={`text-base ${isActive ? 'scale-110' : ''}`} />
              <span>{r.label}</span>
              {count > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-surface-variant text-xs font-mono">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleToggleBookmark}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-bold transition-all shadow-sm ${
            isBookmarked
              ? 'bg-primary text-on-primary border-primary'
              : 'bg-surface-container-lowest border-border-light text-on-surface hover:bg-surface-variant'
          }`}
        >
          <FiBookmark className={`text-base ${isBookmarked ? 'fill-current' : ''}`} />
          <span>{isBookmarked ? 'Saved' : 'Save'}</span>
        </button>

        <button
          type="button"
          onClick={handleShare}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border-light bg-surface-container-lowest text-on-surface hover:bg-surface-variant text-sm font-bold transition-all shadow-sm"
        >
          <FiShare2 className="text-base" />
          <span>Share</span>
        </button>
      </div>
    </div>
  );
}
