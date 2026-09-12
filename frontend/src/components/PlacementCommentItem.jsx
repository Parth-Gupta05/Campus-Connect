import React, { useState, useContext } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { FiCornerDownRight, FiTrash2, FiChevronDown, FiChevronUp, FiSend } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';

export default function PlacementCommentItem({
  comment,
  postId,
  postAuthorId,
  onCommentDeleted
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
  const [replyCount, setReplyCount] = useState(comment.replyCount || 0);

  // Custom Delete Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isAuthor = user && (user.id === comment.author?._id || user._id === comment.author?._id);
  const isAdmin = user?.role === 'admin';
  const isPostOP = postAuthorId && (comment.author?._id === postAuthorId || comment.author === postAuthorId);

  // Toggle & fetch nested replies
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
      // Add solely to this comment's direct replies
      setReplies((prev) => [...prev, res.data.comment]);
      setReplyContent('');
      setShowReplyBox(false);
      setShowReplies(true);
      setRepliesLoaded(true);
      setReplyCount((prev) => prev + 1);
      showToast('Reply posted!', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to post reply', 'error');
    } finally {
      setSubmittingReply(false);
    }
  };

  // Confirm delete comment
  const confirmDelete = async () => {
    try {
      setDeleting(true);
      await axios.delete(`/placements/comments/${comment._id}`);
      showToast('Comment deleted', 'success');
      setShowDeleteModal(false);
      if (onCommentDeleted) onCommentDeleted(comment._id);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete comment', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleChildDeleted = (childId) => {
    setReplies((prev) => prev.filter((r) => r._id !== childId));
    setReplyCount((prev) => Math.max(0, prev - 1));
  };

  const authorName = comment.author?.name || 'Student';
  const authorAvatar = comment.author?.avatarUrl;
  const authorBranch = comment.author?.branch;
  const authorGrad = comment.author?.graduationYear;

  return (
    <div className="relative group/comment">
      {/* Continuous vertical guide line from parent avatar down to replies */}
      {showReplies && replies.length > 0 && (
        <div className="absolute left-[15px] top-10 bottom-0 w-[2px] bg-slate-300 dark:bg-slate-700 pointer-events-none" />
      )}

      {/* Main Comment Content Row */}
      <div className="flex items-start gap-3 pt-2 pb-1 relative z-10">
        {/* Author Avatar with Link */}
        <Link
          to={comment.author?._id ? `/profile` : '#'}
          className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden shadow-xs ring-2 ring-surface-container-lowest hover:ring-primary/40 transition-all z-10"
        >
          {authorAvatar ? (
            <img src={authorAvatar} alt={authorName} className="w-full h-full object-cover" />
          ) : (
            authorName.charAt(0).toUpperCase()
          )}
        </Link>

        {/* Comment Content Bubble */}
        <div className="flex-1 min-w-0">
          <div className="bg-surface-container-low rounded-2xl p-3.5 border border-border-light/60 shadow-xs hover:border-border-light transition-colors">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <Link
                  to={comment.author?._id ? `/profile` : '#'}
                  className="font-bold text-xs text-on-surface hover:text-primary transition-colors flex items-center gap-1.5"
                >
                  <span>{authorName}</span>
                  {isPostOP && (
                    <span className="px-1.5 py-0.5 rounded bg-primary/15 text-primary text-[10px] font-extrabold uppercase tracking-wider">
                      Author
                    </span>
                  )}
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
                  onClick={() => setShowDeleteModal(true)}
                  className="text-on-surface-variant hover:text-error p-1 rounded transition-colors opacity-0 group-hover/comment:opacity-100 cursor-pointer"
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

            {replyCount > 0 && (
              <button
                type="button"
                onClick={handleToggleReplies}
                className="flex items-center gap-1 text-primary hover:text-primary-container transition-colors cursor-pointer font-bold"
              >
                {showReplies ? (
                  <FiChevronUp className="text-xs" />
                ) : (
                  <FiChevronDown className="text-xs" />
                )}
                <span>
                  {showReplies
                    ? 'Hide replies'
                    : `View ${replyCount} ${replyCount === 1 ? 'reply' : 'replies'}`}
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
                className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-border-light bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-xs"
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
                className="px-2 py-2 text-xs text-on-surface-variant hover:text-on-surface cursor-pointer"
              >
                Cancel
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Seamless Curved Branches for Child Replies */}
      {showReplies && (
        <div className="relative">
          {loadingReplies ? (
            <div className="pl-10 py-2 text-xs text-on-surface-variant flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              Loading replies...
            </div>
          ) : (
            replies.map((reply, idx) => {
              const isLast = idx === replies.length - 1;
              return (
                <div key={reply._id} className="relative pl-8">
                  {/* Seamless Curved Elbow Connector (from parent line down and curves into child avatar) */}
                  <div className="absolute left-[15px] top-0 w-4 h-[22px] border-l-2 border-b-2 border-slate-300 dark:border-slate-700 rounded-bl-xl pointer-events-none" />

                  {/* Connect downwards to the next sibling if this is not the last reply */}
                  {!isLast && (
                    <div className="absolute left-[15px] top-[22px] bottom-0 w-[2px] bg-slate-300 dark:bg-slate-700 pointer-events-none" />
                  )}

                  <PlacementCommentItem
                    comment={reply}
                    postId={postId}
                    postAuthorId={postAuthorId}
                    onCommentDeleted={handleChildDeleted}
                  />
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {showDeleteModal && (
        <div
          onClick={() => setShowDeleteModal(false)}
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-surface-container-lowest border border-border-light rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 text-center"
          >
            <div className="w-12 h-12 rounded-2xl bg-error/10 text-error flex items-center justify-center text-xl mx-auto shadow-2xs">
              <FiTrash2 />
            </div>

            <div className="space-y-1.5">
              <h3 className="font-bold text-base text-on-surface">Delete Comment?</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Are you sure you want to delete this comment? This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-border-light text-xs font-bold text-on-surface hover:bg-surface-variant transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={confirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-error text-white hover:bg-error/90 text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {deleting ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <FiTrash2 className="text-xs" /> Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
