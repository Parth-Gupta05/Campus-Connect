import React, { useState, useContext } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { CornerDownRight, Trash2, ChevronDown, ChevronUp, Send } from 'lucide-react';
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
        <div className="absolute left-[15px] top-10 bottom-0 w-[2px] bg-gray-300 dark:bg-gray-800 pointer-events-none" />
      )}

      {/* Main Comment Content Row */}
      <div className="flex items-start gap-3 pt-2 pb-1 relative z-10">
        {/* Author Avatar with Link */}
        <Link
          to={comment.author?._id ? `/profile` : '#'}
          className="w-8 h-8 rounded-full bg-background-200 border border-gray-400 text-gray-1000 flex items-center justify-center font-semibold text-xs shrink-0 overflow-hidden shadow-2xs hover:border-gray-600 transition-all z-10"
        >
          {authorAvatar ? (
            <img src={authorAvatar} alt={authorName} className="w-full h-full object-cover" />
          ) : (
            authorName.charAt(0).toUpperCase()
          )}
        </Link>

        {/* Comment Content Bubble */}
        <div className="flex-1 min-w-0">
          <div className="bg-background-200 rounded-xl p-3.5 border border-gray-400 shadow-2xs hover:border-gray-500 transition-colors">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <Link
                  to={comment.author?._id ? `/profile` : '#'}
                  className="font-semibold text-xs text-gray-1000 hover:text-gray-700 transition-colors flex items-center gap-1.5"
                >
                  <span>{authorName}</span>
                  {isPostOP && (
                    <span className="px-1.5 py-0.5 rounded bg-gray-300 dark:bg-gray-800 text-gray-1000 border border-gray-400 text-[10px] font-mono uppercase tracking-wider font-semibold">
                      Author
                    </span>
                  )}
                </Link>

                {(authorBranch || authorGrad) && (
                  <span className="text-[11px] text-gray-700 font-medium">
                    • {authorBranch} {authorGrad ? `'${authorGrad.slice(-2)}` : ''}
                  </span>
                )}
                <span className="text-[10px] text-gray-600 font-mono">
                  • {comment.createdAt ? formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true }) : 'just now'}
                </span>
              </div>

              {(isAuthor || isAdmin) && (
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  className="text-gray-600 hover:text-red-500 p-1 rounded transition-colors opacity-0 group-hover/comment:opacity-100 cursor-pointer"
                  title="Delete comment"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <p className="text-xs sm:text-sm text-gray-1000 whitespace-pre-line leading-relaxed font-sans">
              {comment.content}
            </p>
          </div>

          {/* Action Bar: Reply & Expand Replies */}
          <div className="flex items-center gap-4 mt-1.5 ml-2 text-xs font-medium text-gray-700 select-none">
            <button
              type="button"
              onClick={() => setShowReplyBox(!showReplyBox)}
              className="flex items-center gap-1 hover:text-gray-1000 transition-colors cursor-pointer"
            >
              <CornerDownRight className="w-3.5 h-3.5" />
              <span>Reply</span>
            </button>

            {replyCount > 0 && (
              <button
                type="button"
                onClick={handleToggleReplies}
                className="flex items-center gap-1 text-gray-1000 hover:text-gray-700 transition-colors cursor-pointer font-medium"
              >
                {showReplies ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
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
                className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-gray-400 bg-background-100 text-gray-1000 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-1000 focus:border-gray-1000 transition-all shadow-2xs"
              />
              <button
                type="submit"
                disabled={submittingReply || !replyContent.trim()}
                className="px-3 py-1.5 bg-gray-1000 text-background-100 rounded-lg text-xs font-medium hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-1 shadow-2xs cursor-pointer"
              >
                {submittingReply ? (
                  <div className="w-3 h-3 border-2 border-background-100 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Send className="w-3 h-3" /> Reply
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowReplyBox(false)}
                className="px-2 py-1.5 text-xs text-gray-700 hover:text-gray-1000 cursor-pointer transition-colors"
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
            <div className="pl-10 py-2 text-xs text-gray-700 flex items-center gap-2 font-mono">
              <div className="w-3 h-3 border-2 border-gray-1000 border-t-transparent rounded-full animate-spin"></div>
              Loading replies...
            </div>
          ) : (
            replies.map((reply, idx) => {
              const isLast = idx === replies.length - 1;
              return (
                <div key={reply._id} className="relative pl-8">
                  {/* Seamless Curved Elbow Connector (from parent line down and curves into child avatar) */}
                  <div className="absolute left-[15px] top-0 w-4 h-[22px] border-l-2 border-b-2 border-gray-300 dark:border-gray-800 rounded-bl-xl pointer-events-none" />

                  {/* Connect downwards to the next sibling if this is not the last reply */}
                  {!isLast && (
                    <div className="absolute left-[15px] top-[22px] bottom-0 w-[2px] bg-gray-300 dark:bg-gray-800 pointer-events-none" />
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
          className="fixed inset-0 bg-black/70 backdrop-blur-md z-[120] flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-background-100 border border-gray-400 rounded-xl p-6 max-w-sm w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 text-center text-gray-1000"
          >
            <div className="w-12 h-12 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 flex items-center justify-center text-xl mx-auto shadow-2xs">
              <Trash2 className="w-5 h-5" />
            </div>

            <div className="space-y-1.5">
              <h3 className="font-semibold text-base text-gray-1000 tracking-tight">Delete Comment?</h3>
              <p className="text-xs text-gray-700 font-sans leading-relaxed">
                Are you sure you want to delete this comment? This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2 rounded-md border border-gray-400 bg-background-100 text-xs font-medium text-gray-800 hover:text-gray-1000 hover:bg-gray-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={confirmDelete}
                className="flex-1 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white text-xs font-medium transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {deleting ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" /> Delete
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
