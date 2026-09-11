import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import RichContentRenderer from '../components/RichContentRenderer';
import ReactionButtons from '../components/ReactionButtons';
import PlacementCommentSection from '../components/PlacementCommentSection';
import { formatDistanceToNow } from 'date-fns';

import {
  FiArrowLeft,
  FiEdit2,
  FiTrash2,
  FiBriefcase,
  FiDollarSign,
  FiMapPin,
  FiGlobe,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiClock,
  FiLayers,
  FiPaperclip,
  FiDownload,
  FiExternalLink,
  FiCalendar,
  FiEye,
  FiShare2
} from 'react-icons/fi';
import { FaGithub, FaLinkedin } from 'react-icons/fa';
import { SiLeetcode } from 'react-icons/si';

export default function PlacementPostDetail() {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null); // Lightbox modal

  const fetchPost = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/placements/${id}`);
      setPost(res.data);
    } catch (err) {
      console.error('Error fetching post:', err);
      showToast('Placement post not found', 'error');
      navigate('/placements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPost();
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this placement experience post?')) return;

    try {
      await axios.delete(`/placements/${id}`);
      showToast('Experience post deleted successfully', 'success');
      navigate('/placements');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete post', 'error');
    }
  };

  const isAuthor = user && post && (post.author?._id === user.id || post.author?._id === user._id);
  const isAdmin = user?.role === 'admin';

  if (loading) {
    return (
      <div className="flex h-screen bg-surface">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!post) return null;

  const formatSalary = (salary) => {
    if (!salary || !salary.amount) return null;
    const amt = Number(salary.amount);
    if (salary.period === 'stipend_per_month' || salary.period === 'monthly') {
      return `₹${amt >= 1000 ? `${(amt / 1000).toFixed(0)}k` : amt} / month`;
    }
    if (amt >= 100000) {
      return `₹${(amt / 100000).toFixed(1)} LPA`;
    }
    return `₹${amt.toLocaleString()}`;
  };

  const getPostTypeLabel = (type) => {
    switch (type) {
      case 'interview_experience': return 'Interview Experience';
      case 'assessment_experience': return 'Online Assessment';
      case 'offer_received': return 'Offer Received';
      case 'rejection_experience': return 'Rejection & Learnings';
      case 'referral_share': return 'Referral Share';
      case 'tips_and_advice': return 'Preparation Guide';
      default: return 'Experience';
    }
  };

  const getOutcomeBadge = (outcome) => {
    switch (outcome) {
      case 'selected':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-green-500/15 text-green-700 font-extrabold text-xs border border-green-500/30">
            <FiCheckCircle className="text-sm" /> Selected / Offer
          </span>
        );
      case 'rejected':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-red-500/10 text-red-600 font-extrabold text-xs border border-red-500/20">
            <FiXCircle className="text-sm" /> Rejected
          </span>
        );
      case 'waitlisted':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 text-amber-600 font-extrabold text-xs border border-amber-500/20">
            <FiAlertCircle className="text-sm" /> Waitlisted
          </span>
        );
      case 'in_process':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-500/10 text-blue-600 font-extrabold text-xs border border-blue-500/20">
            <FiClock className="text-sm" /> In Process
          </span>
        );
      default:
        return null;
    }
  };

  const getDifficultyBadge = (diff) => {
    switch (diff) {
      case 'easy':
        return <span className="px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 font-extrabold text-xs border border-emerald-500/20">Difficulty: Easy</span>;
      case 'medium':
        return <span className="px-3 py-1 rounded-xl bg-amber-500/10 text-amber-600 font-extrabold text-xs border border-amber-500/20">Difficulty: Medium</span>;
      case 'hard':
        return <span className="px-3 py-1 rounded-xl bg-orange-500/10 text-orange-600 font-extrabold text-xs border border-orange-500/20">Difficulty: Hard</span>;
      case 'very_hard':
        return <span className="px-3 py-1 rounded-xl bg-rose-500/10 text-rose-600 font-extrabold text-xs border border-rose-500/20">Difficulty: Very Hard</span>;
      default:
        return null;
    }
  };

  const authorName = post.author?.name || 'Student';
  const authorAvatar = post.author?.avatarUrl;
  const authorBranch = post.branch || post.author?.branch;
  const authorGrad = post.graduationYear || post.author?.graduationYear;
  const fallbackInitial = (post.company?.name || 'C').charAt(0).toUpperCase();

  return (
    <div className="flex h-screen bg-surface overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto bg-surface custom-scrollbar">
        <Topbar />

        <div className="max-w-4xl w-full mx-auto px-4 md:px-8 py-8 space-y-6">
          {/* Top Bar: Back & Author Controls */}
          <div className="flex items-center justify-between gap-4">
            <Link
              to="/placements"
              className="inline-flex items-center gap-2 text-sm font-bold text-on-surface-variant hover:text-primary transition-colors"
            >
              <FiArrowLeft className="text-base" /> Back to Feed
            </Link>

            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-xs text-on-surface-variant font-mono mr-2">
                <FiEye className="text-sm" /> {post.viewCount} views
              </span>

              {(isAuthor || isAdmin) && (
                <>
                  <Link
                    to={`/placements/edit/${post._id}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border-light bg-surface-container-lowest text-on-surface hover:bg-surface-variant text-xs font-bold transition-all shadow-xs"
                  >
                    <FiEdit2 className="text-xs" /> Edit
                  </Link>

                  <button
                    type="button"
                    onClick={handleDelete}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-error/10 text-error hover:bg-error/20 text-xs font-bold transition-all"
                  >
                    <FiTrash2 className="text-xs" /> Delete
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Company & Header Banner */}
          <div className="bg-surface-container-lowest border border-border-light rounded-3xl p-6 md:p-8 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-border-light">
              <div className="flex items-center gap-4">
                {/* Company Logo */}
                <div className="w-16 h-16 rounded-2xl bg-surface-container-low border border-border-light p-2 flex items-center justify-center shrink-0 shadow-xs overflow-hidden">
                  {post.company?.logoUrl ? (
                    <img
                      src={post.company.logoUrl}
                      alt={post.company.name}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.style.display = 'none';
                        if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div
                    style={{ display: post.company?.logoUrl ? 'none' : 'flex' }}
                    className="w-full h-full rounded-xl bg-gradient-to-br from-primary-container to-secondary-container text-on-primary-container items-center justify-center font-bold text-xl"
                  >
                    {fallbackInitial}
                  </div>
                </div>

                {/* Company & Role Information */}
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl md:text-2xl font-extrabold text-on-surface">
                      {post.company?.name}
                    </h1>
                    <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
                      {getPostTypeLabel(post.postType)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-sm text-on-surface-variant font-medium mt-1 flex-wrap">
                    <span className="font-bold text-on-surface">{post.role}</span>
                    {post.company?.domain && (
                      <a
                        href={`https://${post.company.domain}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-xs text-primary hover:underline font-mono"
                      >
                        <FiGlobe className="text-xs" /> {post.company.domain}
                      </a>
                    )}
                    {post.location && (
                      <span className="flex items-center gap-1 text-xs">
                        <FiMapPin className="text-xs" /> {post.location} ({post.workMode || 'Onsite'})
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Badges */}
              <div className="flex items-center gap-2 flex-wrap">
                {getOutcomeBadge(post.outcome)}
                {getDifficultyBadge(post.difficulty)}
              </div>
            </div>

            {/* Structured Meta Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 text-xs">
              {formatSalary(post.salary) && (
                <div className="p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Compensation</div>
                  <div className="text-sm font-extrabold text-emerald-800 mt-0.5">{formatSalary(post.salary)}</div>
                </div>
              )}

              {post.numberOfRounds && (
                <div className="p-3 rounded-2xl bg-surface-container-low border border-border-light">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Selection Process</div>
                  <div className="text-sm font-extrabold text-on-surface mt-0.5">{post.numberOfRounds} Rounds Total</div>
                </div>
              )}

              {post.assessmentType && (
                <div className="p-3 rounded-2xl bg-surface-container-low border border-border-light">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Assessment</div>
                  <div className="text-sm font-extrabold text-on-surface mt-0.5 capitalize">
                    {post.assessmentType.replace('_', ' ')} ({post.assessmentMode || 'Online'})
                  </div>
                </div>
              )}

              {post.interviewType && (
                <div className="p-3 rounded-2xl bg-surface-container-low border border-border-light">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Interview Type</div>
                  <div className="text-sm font-extrabold text-on-surface mt-0.5 capitalize">
                    {post.interviewType.replace('_', ' ')} ({post.interviewMode || 'Online'})
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Author Card */}
          <div className="flex items-center justify-between p-4 md:p-5 rounded-2xl bg-surface-container-lowest border border-border-light shadow-xs">
            <Link
              to={post.author?._id ? `/profile` : '#'}
              className="flex items-center gap-3 group"
            >
              <div className="w-12 h-12 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden shadow-sm group-hover:ring-2 group-hover:ring-primary/40 transition-all">
                {authorAvatar ? (
                  <img src={authorAvatar} alt={authorName} className="w-full h-full object-cover" />
                ) : (
                  authorName.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <div className="font-extrabold text-sm text-on-surface group-hover:text-primary transition-colors flex items-center gap-2">
                  {authorName}
                </div>
                <div className="text-xs text-on-surface-variant">
                  {authorBranch} {authorGrad ? `Class of ${authorGrad}` : ''}
                </div>
              </div>
            </Link>

            <div className="flex items-center gap-2">
              {post.author?.linkedInUrl && (
                <a
                  href={post.author.linkedInUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-xl bg-surface-container-low hover:bg-surface-variant text-on-surface-variant hover:text-[#0a66c2] transition-colors"
                  title="LinkedIn"
                >
                  <FaLinkedin className="text-base" />
                </a>
              )}
              {post.author?.githubUsername && (
                <a
                  href={`https://github.com/${post.author.githubUsername}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-xl bg-surface-container-low hover:bg-surface-variant text-on-surface-variant hover:text-on-surface transition-colors"
                  title="GitHub"
                >
                  <FaGithub className="text-base" />
                </a>
              )}
              {post.author?.leetcodeUsername && (
                <a
                  href={`https://leetcode.com/u/${post.author.leetcodeUsername}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-xl bg-surface-container-low hover:bg-surface-variant text-on-surface-variant hover:text-[#ffa116] transition-colors"
                  title="LeetCode"
                >
                  <SiLeetcode className="text-base" />
                </a>
              )}
            </div>
          </div>

          {/* Main Experience Body (Rich Content) */}
          <div className="bg-surface-container-lowest border border-border-light rounded-3xl p-6 md:p-10 shadow-xs space-y-6">
            <h1 className="text-2xl md:text-3xl font-extrabold text-on-surface leading-snug">
              {post.title}
            </h1>

            <div className="flex items-center gap-2 text-xs text-on-surface-variant font-mono pb-4 border-b border-border-light">
              <FiCalendar /> Posted {post.createdAt ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }) : ''}
            </div>

            {/* Rendered HTML */}
            <RichContentRenderer htmlContent={post.content} />

            {/* Gallery Images (Click to open Lightbox) */}
            {post.images && post.images.length > 0 && (
              <div className="pt-6 border-t border-border-light space-y-3">
                <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider">
                  Attached Screenshots / Whiteboards ({post.images.length})
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {post.images.map((img, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedImage(img)}
                      className="group relative aspect-video rounded-xl overflow-hidden border border-border-light shadow-xs cursor-pointer hover:border-primary transition-all"
                    >
                      <img src={img} alt="Screenshot" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity">
                        View Full
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Document Download Card */}
            {post.attachmentUrl && (
              <div className="pt-4 border-t border-border-light">
                <a
                  href={post.attachmentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-4 rounded-2xl bg-surface-container-low border border-border-light hover:border-primary transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-xl shrink-0">
                      <FiPaperclip />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-on-surface group-hover:text-primary transition-colors">
                        {post.attachmentName || 'Attached Document'}
                      </div>
                      <div className="text-xs text-on-surface-variant">Click to view or download file</div>
                    </div>
                  </div>
                  <FiDownload className="text-lg text-on-surface-variant group-hover:text-primary transition-colors" />
                </a>
              </div>
            )}

            {/* External Links */}
            {post.links && post.links.length > 0 && (
              <div className="pt-4 border-t border-border-light space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Referenced Problem &amp; Preparation Links
                </h4>
                <div className="space-y-1.5">
                  {post.links.map((link, idx) => (
                    <a
                      key={idx}
                      href={link}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 text-xs text-primary font-mono hover:underline truncate"
                    >
                      <FiExternalLink className="text-xs shrink-0" />
                      <span className="truncate">{link}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="pt-4 border-t border-border-light flex items-center gap-2 flex-wrap">
                {post.tags.map((t, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-lg bg-surface-variant text-on-surface font-semibold text-xs"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Reactions & Engagement Card */}
          <ReactionButtons
            postId={post._id}
            initialReactions={post.reactionCounts}
            totalReactions={post.totalReactions}
            initialMyReaction={post.myReactionType}
            initialBookmarked={post.isBookmarkedByMe}
            commentCount={post.commentCount || 0}
            compact={false}
          />

          {/* Threaded Discussion Section */}
          <div className="bg-surface-container-lowest border border-border-light rounded-3xl p-6 md:p-8 shadow-xs">
            <PlacementCommentSection postId={post._id} commentCount={post.commentCount} />
          </div>
        </div>
      </main>

      {/* Image Lightbox Modal */}
      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-[150] flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-200"
        >
          <img
            src={selectedImage}
            alt="Fullscreen preview"
            className="max-w-full max-h-[90vh] rounded-2xl object-contain shadow-2xl"
          />
        </div>
      )}
    </div>
  );
}
