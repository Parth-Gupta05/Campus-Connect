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
        <h3 className="text-sm font-semibold text-gray-1000 tracking-tight flex items-center gap-2">
          Discussion &amp; Queries 
          <span className="px-1.5 py-0.5 rounded-full bg-gray-200 text-gray-700 text-[10px] font-mono leading-none">
            {count}
          </span>
        </h3>
      </div>

      {/* Main Comment Input Form */}
      {user ? (
        <form onSubmit={handleAddComment} className="flex items-start gap-3 mb-10">
          <div className="w-8 h-8 rounded-full bg-background-200 border border-gray-400 text-gray-1000 flex items-center justify-center font-semibold text-xs shrink-0 overflow-hidden">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              (user.name || 'U').charAt(0).toUpperCase()
            )}
          </div>
          <div className="flex-1 min-w-0 flex flex-col relative rounded-lg border border-gray-400 bg-background-100 focus-within:border-gray-600 focus-within:ring-1 focus-within:ring-gray-600 transition-all shadow-2xs group">
            <textarea
              rows={2}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Ask a question or share your thoughts..."
              className="w-full p-3 pb-10 text-xs sm:text-sm bg-transparent text-gray-1000 placeholder:text-gray-500 focus:outline-none resize-none"
            />
            <div className="absolute bottom-2 right-2 flex justify-end">
              <button
                type="submit"
                disabled={submitting || !content.trim()}
                className="h-7 px-3 bg-gray-1000 text-background-100 rounded-md text-xs font-medium hover:opacity-90 transition-all disabled:opacity-40 disabled:bg-gray-400 disabled:text-gray-700 flex items-center gap-1.5 cursor-pointer"
              >
                {submitting ? (
                  <div className="w-3 h-3 border-2 border-background-100 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Send className="w-3 h-3" /> Post
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="py-4 text-center text-xs text-gray-600 mb-6 font-medium">
          Please sign in to join the discussion.
        </div>
      )}

      {/* Comments List */}
      {loading ? (
        <div className="py-8 text-center text-xs text-gray-600 flex items-center justify-center gap-2 font-mono">
          <div className="w-3.5 h-3.5 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
          Loading...
        </div>
      ) : comments.length === 0 ? (
        <div className="py-12 text-center text-gray-500">
          <MessageSquare className="w-6 h-6 mx-auto mb-3 opacity-30" strokeWidth={1.5} />
          <p className="text-xs font-medium">No comments yet.</p>
          <p className="text-[10px] text-gray-500 mt-1 font-mono">Be the first to start the discussion.</p>
        </div>
      ) : (
        <div className="space-y-6">
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
