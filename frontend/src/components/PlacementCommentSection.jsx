import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import PlacementCommentItem from './PlacementCommentItem';
import { FiMessageSquare, FiSend } from 'react-icons/fi';

export default function PlacementCommentSection({ postId, commentCount = 0 }) {
  const { user } = useContext(AuthContext);
  const { showToast } = useToast();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [count, setCount] = useState(commentCount);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/placements/${postId}/comments`);
      setComments(res.data || []);
    } catch (err) {
      console.error('Error fetching comments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      setSubmitting(true);
      const res = await axios.post(`/placements/${postId}/comments`, {
        content: content.trim()
      });
      setComments([res.data.comment, ...comments]);
      setContent('');
      setCount(prev => prev + 1);
      showToast('Comment posted!', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to post comment', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCommentDeleted = (deletedId) => {
    setComments(comments.filter(c => c._id !== deletedId));
    setCount(prev => Math.max(0, prev - 1));
  };

  return (
    <div className="mt-8 pt-8 border-t border-border-light">
      <div className="flex items-center gap-2 mb-6">
        <FiMessageSquare className="text-xl text-primary" />
        <h3 className="text-lg font-bold text-on-surface">
          Discussion &amp; Queries ({count})
        </h3>
      </div>

      {/* Main Comment Input Form */}
      {user ? (
        <form onSubmit={handleAddComment} className="flex items-start gap-3 mb-8">
          <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-sm shrink-0 shadow-sm overflow-hidden">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              (user.name || 'U').charAt(0).toUpperCase()
            )}
          </div>
          <div className="flex-1 min-w-0 flex flex-col gap-2">
            <textarea
              rows={2}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Ask a question about the rounds, difficulty, or congratulate the student..."
              className="w-full p-3.5 text-sm rounded-2xl border border-border-light bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-xs resize-none"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting || !content.trim()}
                className="px-5 py-2.5 bg-primary text-on-primary rounded-xl text-xs font-bold hover:bg-primary-container transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                {submitting ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <FiSend className="text-sm" /> Post Comment
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="p-4 rounded-xl bg-surface-container-low text-center text-sm text-on-surface-variant mb-6">
          Please sign in to join the discussion and ask questions.
        </div>
      )}

      {/* Comments List */}
      {loading ? (
        <div className="py-8 text-center text-sm text-on-surface-variant flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          Loading discussion...
        </div>
      ) : comments.length === 0 ? (
        <div className="py-10 text-center text-on-surface-variant/70 border border-dashed border-border-light rounded-2xl">
          <FiMessageSquare className="text-3xl mx-auto mb-2 opacity-40" />
          <p className="text-sm font-semibold">No queries or comments yet</p>
          <p className="text-xs text-on-surface-variant/60 mt-0.5">
            Be the first to ask about the interview process!
          </p>
        </div>
      ) : (
        <div className="space-y-4 divide-y divide-border-light/40">
          {comments.map((comment) => (
            <PlacementCommentItem
              key={comment._id}
              comment={comment}
              postId={postId}
              onCommentDeleted={handleCommentDeleted}
            />
          ))}
        </div>
      )}
    </div>
  );
}
