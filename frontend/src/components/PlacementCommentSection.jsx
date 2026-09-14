import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import PlacementCommentItem from './PlacementCommentItem';
import { MessageSquare, Send } from 'lucide-react';

export default function PlacementCommentSection({ postId, postAuthorId, commentCount = 0 }) {
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
    <div className="mt-8 pt-8 border-t border-gray-400">
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="w-5 h-5 text-gray-1000" />
        <h3 className="text-base font-semibold text-gray-1000 tracking-tight">
          Discussion &amp; Queries <span className="text-xs font-mono text-gray-600">({count})</span>
        </h3>
      </div>

      {/* Main Comment Input Form */}
      {user ? (
        <form onSubmit={handleAddComment} className="flex items-start gap-3 mb-8">
          <div className="w-9 h-9 rounded-full bg-background-200 border border-gray-400 text-gray-1000 flex items-center justify-center font-semibold text-xs shrink-0 shadow-2xs overflow-hidden">
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
              className="w-full p-3 text-xs sm:text-sm rounded-lg border border-gray-400 bg-background-100 text-gray-1000 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-1000 focus:border-gray-1000 transition-all shadow-2xs resize-none"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting || !content.trim()}
                className="px-4 py-2 bg-gray-1000 text-background-100 rounded-lg text-xs font-medium hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                {submitting ? (
                  <div className="w-3.5 h-3.5 border-2 border-background-100 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" /> Post Comment
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="p-4 rounded-lg bg-background-200 border border-gray-400 text-center text-xs text-gray-700 mb-6">
          Please sign in to join the discussion and ask questions.
        </div>
      )}

      {/* Comments List */}
      {loading ? (
        <div className="py-8 text-center text-xs text-gray-700 flex items-center justify-center gap-2 font-mono">
          <div className="w-4 h-4 border-2 border-gray-1000 border-t-transparent rounded-full animate-spin"></div>
          Loading discussion...
        </div>
      ) : comments.length === 0 ? (
        <div className="py-10 text-center text-gray-600 border border-dashed border-gray-400 rounded-xl bg-background-100/40">
          <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40 text-gray-600" />
          <p className="text-xs sm:text-sm font-semibold text-gray-1000">No queries or comments yet</p>
          <p className="text-xs text-gray-600 mt-0.5">
            Be the first to ask about the interview process!
          </p>
        </div>
      ) : (
        <div className="space-y-4 divide-y divide-gray-300 dark:divide-gray-800">
          {comments.map((comment) => (
            <PlacementCommentItem
              key={comment._id}
              comment={comment}
              postId={postId}
              postAuthorId={postAuthorId}
              onCommentDeleted={handleCommentDeleted}
            />
          ))}
        </div>
      )}
    </div>
  );
}
