import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import PlacementCommentItem from '../components/PlacementCommentItem';

export default function PlacementCommentThread() {
  const { postId, commentId } = useParams();
  const { user } = useContext(AuthContext);
  const { showToast } = useToast();

  const [post, setPost] = useState(null);
  const [rootComment, setRootComment] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch post details (minimal) and root comment
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [postRes, commentRes] = await Promise.all([
          axios.get(`/placements/${postId}`),
          axios.get(`/placements/${postId}/comments/${commentId}`)
        ]);
        setPost(postRes.data);
        setRootComment(commentRes.data);
      } catch (err) {
        showToast('Failed to load thread data', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [postId, commentId]);

  const handleRootCommentDeleted = () => {
    // If the root comment is deleted, redirect back to the post
    window.location.href = `/placements/${postId}`;
  };

  if (loading) {
    return (
      <div className="flex-1 p-8 flex justify-center items-center h-full">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-gray-1000 rounded-full animate-spin"></div>
          <p className="text-sm font-medium font-mono">Loading thread...</p>
        </div>
      </div>
    );
  }

  if (!rootComment) {
    return (
      <div className="flex-1 p-8 flex justify-center items-center h-full">
        <div className="text-center text-gray-500">
          <p className="text-sm font-medium font-mono mb-4">Thread not found or deleted.</p>
          <Link
            to={`/placements/${postId}`}
            className="text-gray-1000 font-semibold hover:underline"
          >
            Return to post
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-w-0 bg-background-100">
      <div className="max-w-4xl w-full mx-auto p-4 sm:p-8 space-y-6">
        {/* Top Navigation */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <Link
            to={`/placements/${postId}`}
            className="inline-flex items-center gap-2 text-xs font-medium text-gray-700 hover:text-gray-1000 transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4" /> View all comments
          </Link>
        </div>

        {/* Post Context Strip */}
        {post && (
          <div className="bg-background-200 border border-gray-400 rounded-xl p-4 shadow-2xs flex flex-col gap-2 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
            <div className="pl-2">
              <h3 className="text-xs font-mono font-bold text-gray-500 uppercase tracking-wider mb-1">
                Thread Context
              </h3>
              <Link to={`/placements/${postId}`} className="text-sm font-semibold text-gray-1000 hover:underline">
                {post.title}
              </Link>
              <div className="text-[11px] text-gray-600 mt-0.5">
                Posted by {post.author?.name || 'Student'}
              </div>
            </div>
          </div>
        )}

        {/* Thread Root & Replies */}
        <div className="bg-background-100 pt-6">
          <div className="flex items-center gap-2 mb-6 pb-2 border-b border-gray-300">
            <MessageSquare className="w-4 h-4 text-gray-1000" />
            <h2 className="text-lg font-bold text-gray-1000">Single comment thread</h2>
          </div>

          <div className="px-2">
            <PlacementCommentItem
              comment={rootComment}
              postId={postId}
              postAuthorId={post?.author?._id}
              onCommentDeleted={handleRootCommentDeleted}
              depth={0} // Reset depth so this thread has full depth again!
            />
          </div>
        </div>
      </div>
    </div>
  );
}
