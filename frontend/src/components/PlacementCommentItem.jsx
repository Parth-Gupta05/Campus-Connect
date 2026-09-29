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
  onCommentDeleted,
  depth = 0
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
    <div className="group/comment pt-1">
      {/* Main Comment Content Row */}
      <div className="flex items-stretch gap-3 relative z-10">
        {/* Avatar & Vertical Line */}
        <div className="flex flex-col items-center shrink-0">
          <Link
            to={comment.author?._id ? `/profile` : '#'}
            className="w-8 h-8 rounded-full bg-background-200 border border-gray-400 text-gray-1000 flex items-center justify-center font-semibold text-xs shrink-0 overflow-hidden mt-0.5"
          >
            {authorAvatar ? (
              <img src={authorAvatar} alt={authorName} className="w-full h-full object-cover" />
            ) : (
              authorName.charAt(0).toUpperCase()
            )}
          </Link>
          
          {showReplies && (
            <div className="w-px bg-gray-300 flex-1 mt-1.5" />
          )}
        </div>

        {/* Comment Content Flat */}
        <div className="flex-1 min-w-0 pb-3">
          <div className="flex flex-wrap items-baseline gap-1.5 mb-1">
            <Link
              to={comment.author?._id ? `/profile` : '#'}
              className="font-medium text-[13px] text-gray-1000 hover:underline hover:underline-offset-2 decoration-gray-400"
            >
              {authorName}
            </Link>
            {isPostOP && (
              <span className="px-1 py-[1px] rounded bg-gray-200 text-gray-700 text-[9px] font-mono uppercase tracking-wider font-semibold">
                OP
              </span>
            )}
            {(authorBranch || authorGrad) && (
              <span className="text-[10px] text-gray-500 font-medium">
                • {authorBranch} {authorGrad ? `'${authorGrad.slice(-2)}` : ''}
              </span>
            )}
            <span className="text-[10px] text-gray-400 font-mono">
              • {comment.createdAt ? formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true }) : 'just now'}
            </span>
            
            {(isAuthor || isAdmin) && (
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="ml-auto text-gray-400 hover:text-red-500 p-0.5 rounded transition-colors opacity-0 group-hover/comment:opacity-100 cursor-pointer"
                title="Delete comment"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <p className="text-[13px] sm:text-sm text-gray-800 whitespace-pre-line leading-relaxed font-sans mb-1.5">
            {comment.content}
          </p>

          {/* Action Bar: Reply & Expand Replies */}
          <div className="flex items-center gap-4 text-xs font-medium text-gray-500 select-none">
            {depth < 3 && (
              <button
                type="button"
                onClick={() => setShowReplyBox(!showReplyBox)}
                className="flex items-center gap-1 hover:text-gray-900 transition-colors cursor-pointer"
              >
                <CornerDownRight className="w-3.5 h-3.5" />
                <span>Reply</span>
              </button>
            )}

            {replyCount > 0 && depth < 3 && (
              <button
                type="button"
                onClick={handleToggleReplies}
                className="flex items-center gap-1 hover:text-gray-900 transition-colors cursor-pointer font-medium"
              >
                {showReplies ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
                <span>
                  {showReplies
                    ? 'Hide'
                    : `View ${replyCount} ${replyCount === 1 ? 'reply' : 'replies'}`}
                </span>
              </button>
            )}

            {depth >= 3 && (
              <Link
                to={`/placements/${postId}/comment/${comment._id}`}
                className="flex items-center gap-1 text-blue-600 hover:text-blue-700 transition-colors font-medium hover:underline"
              >
                <span>Continue this thread</span>
                <CornerDownRight className="w-3 h-3" />
              </Link>
            )}
          </div>

          {/* Inline Reply Input Box */}
          {showReplyBox && (
            <form onSubmit={handleSendReply} className="flex flex-col relative rounded-lg border border-gray-400 bg-background-100 focus-within:border-gray-600 focus-within:ring-1 focus-within:ring-gray-600 transition-all mt-3 mb-2 shadow-2xs group">
              <textarea
                rows={1}
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder={`Replying to ${authorName}...`}
                autoFocus
                className="w-full p-2.5 pb-9 text-xs sm:text-sm bg-transparent text-gray-1000 placeholder:text-gray-500 focus:outline-none resize-none"
              />
              <div className="absolute bottom-1.5 right-1.5 flex justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowReplyBox(false)}
                  className="h-6 px-2 text-[11px] text-gray-500 hover:text-gray-800 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReply || !replyContent.trim()}
                  className="h-6 px-2.5 bg-gray-1000 text-background-100 rounded text-[11px] font-medium hover:opacity-90 transition-all disabled:opacity-40 flex items-center gap-1 cursor-pointer"
                >
                  {submittingReply ? (
                    <div className="w-2.5 h-2.5 border-2 border-background-100 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    'Reply'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Seamless Curved Branches for Child Replies */}
      {showReplies && (
        <div className="relative">
          {loadingReplies ? (
            <div className="py-2 pl-[44px] text-[11px] text-gray-500 flex items-center gap-2 font-mono">
              <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
              Loading...
            </div>
          ) : (
            replies.map((reply, idx) => {
              const isLast = idx === replies.length - 1;
              return (
                <div key={reply._id} className="relative pl-[40px] sm:pl-[44px]">
                  {/* Elbow Connector */}
                  <div className="absolute left-[15px] top-0 w-[25px] sm:w-[29px] h-[22px] border-l border-b border-gray-300 rounded-bl-[10px] pointer-events-none" />

                  {/* Connect downwards to the next sibling if this is not the last reply */}
                  {!isLast && (
                    <div className="absolute left-[15px] top-[22px] bottom-0 w-px bg-gray-300 pointer-events-none" />
                  )}

                  <PlacementCommentItem
                    comment={reply}
                    postId={postId}
                    postAuthorId={postAuthorId}
                    onCommentDeleted={handleChildDeleted}
                    depth={depth + 1}
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
