import React, { useState } from 'react';
import axios from 'axios';
import { Award, Zap, Sparkles, ThumbsUp, Bookmark, Share2, MessageSquare } from 'lucide-react';
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
      icon: Award,
      accentText: 'text-emerald-600 dark:text-emerald-400',
      activeBg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
    },
    {
      id: 'insightful',
      label: 'Insightful',
      icon: Zap,
      accentText: 'text-amber-600 dark:text-amber-400',
      activeBg: 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
    },
    {
      id: 'celebrate',
      label: 'Celebrate',
      icon: Sparkles,
      accentText: 'text-purple-600 dark:text-purple-400',
      activeBg: 'bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-400'
    },
    {
      id: 'like',
      label: 'Like',
      icon: ThumbsUp,
      accentText: 'text-blue-600 dark:text-blue-400',
      activeBg: 'bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400'
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
      <div className="flex items-center justify-between pt-3 border-t border-gray-400 text-gray-700 text-xs">
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
                className={`h-7 px-2.5 rounded-md border text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                  isActive
                    ? `${r.activeBg} font-semibold`
                    : 'border-gray-400 bg-background-100 text-gray-700 hover:text-gray-1000 hover:bg-gray-200'
                }`}
                title={r.label}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? r.accentText : 'text-gray-500'}`} strokeWidth={1.5} />
                {count > 0 && <span className="font-mono text-[11px]">{count}</span>}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1.5">
          {onCommentClick && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onCommentClick();
              }}
              className="h-7 px-2 rounded-md border border-gray-400 bg-background-100 text-xs font-medium text-gray-700 hover:text-gray-1000 hover:bg-gray-200 transition-colors shadow-2xs flex items-center gap-1 cursor-pointer"
              title="Comments"
            >
              <MessageSquare className="w-3.5 h-3.5 text-gray-500" strokeWidth={1.5} />
              <span className="font-mono text-[11px]">{commentCount}</span>
            </button>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleToggleBookmark();
            }}
            className={`h-7 w-7 rounded-md border transition-all flex items-center justify-center cursor-pointer shadow-2xs ${
              isBookmarked
                ? 'border-gray-1000 bg-gray-1000 text-background-100'
                : 'border-gray-400 bg-background-100 text-gray-600 hover:text-gray-1000 hover:bg-gray-200'
            }`}
            title={isBookmarked ? 'Saved to bookmarks' : 'Save post'}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`} strokeWidth={1.5} />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleShare();
            }}
            className="h-7 w-7 rounded-md border border-gray-400 bg-background-100 text-gray-600 hover:text-gray-1000 hover:bg-gray-200 transition-colors shadow-2xs flex items-center justify-center cursor-pointer"
            title="Copy share link"
          >
            <Share2 className="w-3.5 h-3.5" strokeWidth={1.5} />
          </button>
        </div>
      </div>
    );
  }

  // Expanded View for Post Detail
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-background-200 border border-gray-400 text-gray-1000">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 w-full min-w-0">
        <span className="text-[10px] font-mono uppercase tracking-wider text-gray-600 shrink-0">
          Reactions:
        </span>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 -mb-1 sm:pb-0 sm:mb-0 w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {reactionConfig.map((r) => {
            const Icon = r.icon;
            const count = reactionCounts[r.id] || 0;
            const isActive = myReaction === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => handleToggleReaction(r.id)}
                className={`h-8 px-3 rounded-md border text-xs font-medium transition-all shadow-2xs flex items-center gap-2 cursor-pointer shrink-0 ${
                  isActive
                    ? `${r.activeBg} font-semibold`
                    : 'border-gray-400 bg-background-100 text-gray-800 hover:text-gray-1000 hover:bg-gray-200'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? r.accentText : 'text-gray-500'}`} strokeWidth={1.5} />
                <span>{r.label}</span>
                {count > 0 && (
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${
                    isActive ? 'bg-background-100/40 border-current' : 'bg-background-200 border-gray-400 text-gray-700'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 border-t border-gray-400 sm:border-none pt-3 sm:pt-0 w-full sm:w-auto">
        <button
          type="button"
          onClick={handleToggleBookmark}
          className={`flex-1 sm:flex-none h-8 px-3.5 rounded-md border text-xs font-medium transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer ${
            isBookmarked
              ? 'border-gray-1000 bg-gray-1000 text-background-100 font-semibold'
              : 'border-gray-400 bg-background-100 text-gray-800 hover:text-gray-1000 hover:bg-gray-200'
          }`}
        >
          <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`} strokeWidth={1.5} />
          <span>{isBookmarked ? 'Saved' : 'Save'}</span>
        </button>

        <button
          type="button"
          onClick={handleShare}
          className="flex-1 sm:flex-none h-8 px-3.5 rounded-md border border-gray-400 bg-background-100 text-xs font-medium text-gray-800 hover:text-gray-1000 hover:bg-gray-200 transition-colors shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Share2 className="w-3.5 h-3.5" strokeWidth={1.5} />
          <span>Share</span>
        </button>
      </div>
    </div>
  );
}
