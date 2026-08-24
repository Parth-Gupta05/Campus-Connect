import React, { useState, useContext } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { FiCornerDownRight, FiTrash2, FiMessageSquare, FiChevronDown, FiChevronUp, FiSend } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';

export default function PlacementCommentItem({
  comment,
  postId,
  onCommentDeleted,
  onReplyAdded
}) {
  const { user } = useContext(AuthContext);
  const { showToast } = useToast();
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [replies, setReplies] = useState([]);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [repliesLoaded, setRepliesLoaded] = useState(false);
  const [showReplies, setShowReplies] = useState(false);

  const isAuthor = user && (user.id === comment.author?._id || user._id === comment.author?._id);
  const isAdmin = user?.role === 'admin';

  // Load nested replies
  const handleToggleReplies = async () => {
    if (!repliesLoaded && !loadingReplies) {
      try {
        setLoadingReplies(true);
        const res = await axios.get(`/placements/${postId}/comments?parentCommentId=${comment._id}`);
        setReplies(res.data || []);
        setRepliesLoaded(true);
        setShowReplies(true);
      } catch (err) {
        showToast('Failed to load replies', 'error');
      } finally {
        setLoadingReplies(false);
      }
    } else {
      setShowReplies(!showReplies);
    }
  };

  // Submit nested reply
  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    try {
      setSubmittingReply(true);
      const res = await axios.post(`/placements/${postId}/comments`, {
        content: replyContent.trim(),
        parentCommentId: comment._id
      });
      setReplies([...replies, res.data.comment]);
      setReplyContent('');
      setShowReplyBox(false);
      setShowReplies(true);
      setRepliesLoaded(true);
      if (onReplyAdded) onReplyAdded(res.data.comment);
      showToast('Reply posted!', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to post reply', 'error');
    } finally {
      setSubmittingReply(false);
    }
  };

  // Delete comment
  const handleDelete = async () => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await axios.delete(`/placements/comments/${comment._id}`);
      showToast('Comment deleted', 'success');
      if (onCommentDeleted) onCommentDeleted(comment._id);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete comment', 'error');
    }
  };

  const handleChildDeleted = (childId) => {
    setReplies(replies.filter(r => r._id !== childId));
  };

  const authorName = comment.author?.name || 'Student';
  const authorAvatar = comment.author?.avatarUrl;
  const authorBranch = comment.author?.branch;
  const authorGrad = comment.author?.graduationYear;

  return (
    <div className="relative group">
      {/* Comment Body */}
      <div className="flex items-start gap-3 py-2">
        {/* Author Avatar with link */}
        <Link
          to={comment.author?._id ? `/profile` : '#'}
          className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden shadow-sm hover:ring-2 hover:ring-primary/40 transition-all"
        >
          {authorAvatar ? (
            <img src={authorAvatar} alt={authorName} className="w-full h-full object-cover" />
          ) : (
            authorName.charAt(0).toUpperCase()
          )}
        </Link>

        {/* Comment Content Area */}
        <div className="flex-1 min-w-0">
          <div className="bg-surface-container-low rounded-2xl p-3.5 border border-border-light/60 shadow-xs">
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Link
                  to={comment.author?._id ? `/profile` : '#'}
                  className="font-bold text-xs text-on-surface hover:text-primary transition-colors"
                >
                  {authorName}
                </Link>
                {(authorBranch || authorGrad) && (
                  <span className="text-[11px] text-on-surface-variant font-medium">
                    • {authorBranch} {authorGrad ? `'${authorGrad.slice(-2)}` : ''}
                  </span>
                )}
                <span className="text-[10px] text-on-surface-variant/70 font-mono">
                  • {comment.createdAt ? formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true }) : 'just now'}
                </span>
              </div>

              {(isAuthor || isAdmin) && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="text-on-surface-variant hover:text-error p-1 rounded transition-colors opacity-0 group-hover:opacity-100"
                  title="Delete comment"
                >
                  <FiTrash2 className="text-xs" />
                </button>
              )}
            </div>

            <p className="text-sm text-on-surface/90 whitespace-pre-line leading-relaxed">
              {comment.content}
            </p>
          </div>

          {/* Action Bar: Reply & Expand Replies */}
          <div className="flex items-center gap-4 mt-1.5 ml-2 text-xs font-semibold text-on-surface-variant select-none">
            <button
              type="button"
              onClick={() => setShowReplyBox(!showReplyBox)}
              className="flex items-center gap-1 hover:text-primary transition-colors cursor-pointer"
            >
              <FiCornerDownRight className="text-xs" />
              <span>Reply</span>
            </button>

            {comment.replyCount > 0 && (
              <button
                type="button"
                onClick={handleToggleReplies}
                className="flex items-center gap-1 text-primary hover:text-primary-container transition-colors cursor-pointer font-bold"
              >
                {showReplies ? <FiChevronUp /> : <FiChevronDown />}
                <span>
                  {showReplies
                    ? 'Hide replies'
                    : `View ${comment.replyCount} ${comment.replyCount === 1 ? 'reply' : 'replies'}`}
                </span>
              </button>
            )}
          </div>

          {/* Inline Reply Input Box */}
          {showReplyBox && (
            <form onSubmit={handleSendReply} className="flex items-center gap-2 mt-3 animate-in fade-in duration-150">
              <input
                type="text"
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder={`Replying to ${authorName}...`}
                autoFocus
                className="flex-1 px-3 py-2 text-xs rounded-xl border border-border-light bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-xs"
              />
              <button
                type="submit"
                disabled={submittingReply || !replyContent.trim()}
                className="px-3.5 py-2 bg-primary text-on-primary rounded-xl text-xs font-bold hover:bg-primary-container transition-all disabled:opacity-50 flex items-center gap-1 shadow-xs cursor-pointer"
              >
                {submittingReply ? (
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <FiSend className="text-xs" /> Reply
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowReplyBox(false)}
                className="px-2 py-2 text-xs text-on-surface-variant hover:text-on-surface"
              >
                Cancel
              </button>
            </form>
          )}

          {/* Nested Replies Section with YouTube-style connecting lines */}
          {showReplies && (
            <div className="relative pl-4 mt-2 space-y-2 border-l-2 border-border-light/80">
              {loadingReplies ? (
                <div className="py-2 text-xs text-on-surface-variant flex items-center gap-2">
                  <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  Loading replies...
                </div>
              ) : (
                replies.map((reply) => (
                  <PlacementCommentItem
                    key={reply._id}
                    comment={reply}
                    postId={postId}
                    onCommentDeleted={handleChildDeleted}
                    onReplyAdded={(newRep) => {
                      setReplies(prev => [...prev, newRep]);
                    }}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
