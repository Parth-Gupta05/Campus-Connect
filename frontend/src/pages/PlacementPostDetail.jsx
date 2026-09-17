import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import RichContentRenderer from '../components/RichContentRenderer';
import ReactionButtons from '../components/ReactionButtons';
import PlacementCommentSection from '../components/PlacementCommentSection';
import { formatDistanceToNow } from 'date-fns';

import {
  ArrowLeft,
  Edit2,
  Trash2,
  Briefcase,
  MapPin,
  Globe,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Layers,
  Paperclip,
  Download,
  ExternalLink,
  Calendar,
  Eye,
  IndianRupee,
  Share2
} from 'lucide-react';
import { FaGithub, FaLinkedin } from 'react-icons/fa';
import { SiLeetcode } from 'react-icons/si';

export default function PlacementPostDetail() {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  useEffect(() => {
    if (showDeleteModal || selectedImage) {
      const originalBody = document.body.style.overflow;
      const originalHtml = document.documentElement.style.overflow;
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalBody;
        document.documentElement.style.overflow = originalHtml;
      };
    }
  }, [showDeleteModal, selectedImage]);

  const confirmDelete = async () => {
    try {
      setDeleting(true);
      await axios.delete(`/placements/${id}`);
      showToast('Experience post deleted successfully', 'success');
      setShowDeleteModal(false);
      navigate('/placements');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete post', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const isAuthor = user && post && (post.author?._id === user.id || post.author?._id === user._id);
  const isAdmin = user?.role === 'admin';

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-1000 border-t-transparent rounded-full animate-spin"></div>
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
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium text-xs border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> Selected / Offer
          </span>
        );
      case 'rejected':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 font-medium text-xs border border-red-500/20">
            <XCircle className="w-3.5 h-3.5" /> Rejected
          </span>
        );
      case 'waitlisted':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium text-xs border border-amber-500/20">
            <AlertCircle className="w-3.5 h-3.5" /> Waitlisted
          </span>
        );
      case 'in_process':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium text-xs border border-blue-500/20">
            <Clock className="w-3.5 h-3.5" /> In Process
          </span>
        );
      default:
        return null;
    }
  };

  const getDifficultyBadge = (diff) => {
    switch (diff) {
      case 'easy':
        return <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium text-xs border border-emerald-500/20">Difficulty: Easy</span>;
      case 'medium':
        return <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium text-xs border border-amber-500/20">Difficulty: Medium</span>;
      case 'hard':
        return <span className="px-3 py-1 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 font-medium text-xs border border-orange-500/20">Difficulty: Hard</span>;
      case 'very_hard':
        return <span className="px-3 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 font-medium text-xs border border-rose-500/20">Difficulty: Very Hard</span>;
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
    <>
      <div className="flex-1 min-w-0 bg-background-100">
        <div className="max-w-6xl w-full mx-auto p-4 sm:p-8 space-y-6">
          {/* Top Bar: Back & Author Controls */}
          <div className="flex items-center justify-between gap-4">
            <Link
              to="/placements"
              className="inline-flex items-center gap-2 text-xs font-medium text-gray-700 hover:text-gray-1000 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Feed
            </Link>

            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-xs text-gray-600 font-mono mr-2">
                <Eye className="w-3.5 h-3.5" /> {post.viewCount} views
              </span>

              {(isAuthor || isAdmin) && (
                <>
                  <Link
                    to={`/placements/edit/${post._id}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-400 bg-background-100 text-gray-1000 hover:bg-background-200 text-xs font-medium transition-all shadow-2xs"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </Link>

                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/10 text-xs font-medium transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Company & Header Banner */}
          <div className="group relative isolate overflow-hidden bg-background-200 border border-gray-400 rounded-xl p-6 md:p-8 shadow-2xs">
            {/* Top Left Color Leak Effect from Logo */}
            {post.company?.logoUrl ? (
              <div 
                className="absolute -top-32 -left-32 w-96 h-96 pointer-events-none z-0 transition-all duration-500 opacity-30 dark:opacity-15 group-hover:opacity-50 dark:group-hover:opacity-30 mix-blend-multiply dark:mix-blend-plus-lighter"
                style={{
                  backgroundImage: `url(${post.company.logoUrl})`,
                  backgroundSize: 'contain',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  filter: 'blur(70px) saturate(250%)'
                }}
              />
            ) : (
              <div className="absolute -top-32 -left-32 w-96 h-96 bg-gray-400/30 dark:bg-gray-400/10 blur-[70px] rounded-full pointer-events-none z-0 transition-all duration-500 group-hover:bg-gray-400/40 dark:group-hover:bg-gray-400/20" />
            )}

            {/* Fading Border Glow on Top Left */}
            <div 
              className="absolute inset-0 rounded-xl pointer-events-none z-20 transition-opacity duration-500 opacity-60 dark:opacity-40 group-hover:opacity-100 border-t-[1.5px] border-l-[1.5px] border-gray-400 dark:border-white/40"
              style={{
                WebkitMaskImage: 'radial-gradient(circle at top left, black 0%, transparent 60%)',
                maskImage: 'radial-gradient(circle at top left, black 0%, transparent 60%)'
              }}
            />

            <div className="relative z-10">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-gray-400">
              <div className="flex items-center gap-4">
                {/* Company Logo */}
                <div className="w-16 h-16 rounded-xl bg-background-100 border border-gray-400 p-2 flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">
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
                    className="w-full h-full rounded-lg bg-gray-300 dark:bg-gray-800 text-gray-1000 items-center justify-center font-bold text-xl font-mono"
                  >
                    {fallbackInitial}
                  </div>
                </div>

                {/* Company & Role Information */}
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl md:text-2xl font-bold text-gray-1000 tracking-tight">
                      {post.company?.name}
                    </h1>
                    <span className="px-2.5 py-0.5 rounded-full bg-gray-300 dark:bg-gray-800 text-gray-1000 border border-gray-400 text-[11px] font-mono uppercase tracking-wider font-medium">
                      {getPostTypeLabel(post.postType)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs sm:text-sm text-gray-700 font-medium mt-1.5 flex-wrap">
                    <span className="font-semibold text-gray-1000">{post.role}</span>
                    {post.company?.domain && (
                      <a
                        href={`https://${post.company.domain}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-xs text-gray-1000 hover:underline font-mono"
                      >
                        <Globe className="w-3.5 h-3.5" /> {post.company.domain}
                      </a>
                    )}
                    {post.location && (
                      <span className="flex items-center gap-1 text-xs text-gray-700">
                        <MapPin className="w-3.5 h-3.5" /> {post.location} ({post.workMode || 'Onsite'})
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
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 text-xs">
              {formatSalary(post.salary) && (
                <div className="p-3.5 rounded-lg bg-background-100 border border-gray-400">
                  <div className="text-[10px] font-mono font-semibold uppercase tracking-wider text-gray-600">Compensation</div>
                  <div className="text-sm font-semibold font-mono text-emerald-600 dark:text-emerald-400 mt-1">{formatSalary(post.salary)}</div>
                </div>
              )}

              {post.numberOfRounds && (
                <div className="p-3.5 rounded-lg bg-background-100 border border-gray-400">
                  <div className="text-[10px] font-mono font-semibold uppercase tracking-wider text-gray-600">Selection Process</div>
                  <div className="text-sm font-semibold text-gray-1000 mt-1">{post.numberOfRounds} Rounds Total</div>
                </div>
              )}

              {((post.assessmentTypes && post.assessmentTypes.length > 0) || post.assessmentType) && (
                <div className="p-3.5 rounded-lg bg-background-100 border border-gray-400">
                  <div className="text-[10px] font-mono font-semibold uppercase tracking-wider text-gray-600">Assessment Rounds</div>
                  <div className="text-sm font-semibold text-gray-1000 mt-1 capitalize">
                    {post.assessmentTypes?.length > 0
                      ? post.assessmentTypes.map((t) => t.replace(/_/g, ' ')).join(', ')
                      : post.assessmentType?.replace(/_/g, ' ')}
                  </div>
                </div>
              )}

              {((post.interviewTypes && post.interviewTypes.length > 0) || post.interviewType) && (
                <div className="p-3.5 rounded-lg bg-background-100 border border-gray-400">
                  <div className="text-[10px] font-mono font-semibold uppercase tracking-wider text-gray-600">Interview Rounds</div>
                  <div className="text-sm font-semibold text-gray-1000 mt-1 capitalize">
                    {post.interviewTypes?.length > 0
                      ? post.interviewTypes.map((t) => t.replace(/_/g, ' ')).join(', ')
                      : post.interviewType?.replace(/_/g, ' ')}
                  </div>
                </div>
              )}

              {((post.interviewModes && post.interviewModes.length > 0) || post.interviewMode) && (
                <div className="p-3.5 rounded-lg bg-background-100 border border-gray-400">
                  <div className="text-[10px] font-mono font-semibold uppercase tracking-wider text-gray-600">Evaluation Mode</div>
                  <div className="text-sm font-semibold text-gray-1000 mt-1 capitalize">
                    {post.interviewModes?.length > 0
                      ? post.interviewModes.map((m) => m.replace(/_/g, ' ')).join(', ')
                      : post.interviewMode?.replace(/_/g, ' ')}
                  </div>
                </div>
              )}
            </div>
          </div>
          </div>

          {/* Author Card */}
          <div className="flex items-center justify-between p-4 md:p-5 rounded-xl bg-background-200 border border-gray-400 shadow-2xs">
            <Link
              to={post.author?._id ? `/profile` : '#'}
              className="flex items-center gap-3 group"
            >
              <div className="w-10 h-10 rounded-full bg-background-100 border border-gray-400 text-gray-1000 flex items-center justify-center font-semibold text-xs shrink-0 overflow-hidden shadow-2xs group-hover:border-gray-600 transition-all">
                {authorAvatar ? (
                  <img src={authorAvatar} alt={authorName} className="w-full h-full object-cover" />
                ) : (
                  authorName.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <div className="font-semibold text-xs sm:text-sm text-gray-1000 group-hover:text-gray-700 transition-colors flex items-center gap-2">
                  {authorName}
                </div>
                <div className="text-xs text-gray-600 font-sans">
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
                  className="p-2 rounded-lg bg-background-100 border border-gray-400 hover:bg-background-200 text-gray-700 hover:text-blue-600 transition-colors"
                  title="LinkedIn"
                >
                  <FaLinkedin className="text-sm" />
                </a>
              )}
              {post.author?.githubUsername && (
                <a
                  href={`https://github.com/${post.author.githubUsername}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-lg bg-background-100 border border-gray-400 hover:bg-background-200 text-gray-700 hover:text-gray-1000 transition-colors"
                  title="GitHub"
                >
                  <FaGithub className="text-sm" />
                </a>
              )}
              {post.author?.leetcodeUsername && (
                <a
                  href={`https://leetcode.com/u/${post.author.leetcodeUsername}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-lg bg-background-100 border border-gray-400 hover:bg-background-200 text-gray-700 hover:text-amber-500 transition-colors"
                  title="LeetCode"
                >
                  <SiLeetcode className="text-sm" />
                </a>
              )}
            </div>
          </div>

          {/* Main Experience Body (Rich Content) */}
          <div className="bg-background-200 border border-gray-400 rounded-xl p-6 md:p-8 shadow-2xs space-y-6">
            <h1 className="text-xl md:text-2xl font-bold text-gray-1000 tracking-tight leading-snug">
              {post.title}
            </h1>

            <div className="flex items-center gap-2 text-xs text-gray-600 font-mono pb-4 border-b border-gray-400">
              <Calendar className="w-3.5 h-3.5" /> Posted {post.createdAt ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }) : ''}
            </div>

            {/* Rendered HTML */}
            <div className="text-gray-1000 text-sm leading-relaxed">
              <RichContentRenderer htmlContent={post.content} />
            </div>

            {/* Gallery Images (Click to open Lightbox) */}
            {post.images && post.images.length > 0 && (
              <div className="pt-6 border-t border-gray-400 space-y-3">
                <h3 className="text-xs font-mono font-semibold text-gray-1000 uppercase tracking-wider">
                  Attached Screenshots / Whiteboards ({post.images.length})
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {post.images.map((img, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedImage(img)}
                      className="group relative aspect-video rounded-lg overflow-hidden border border-gray-400 shadow-2xs cursor-pointer hover:border-gray-1000 transition-all bg-background-100"
                    >
                      <img src={img} alt="Screenshot" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-medium transition-opacity">
                        View Full
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Document Download Card */}
            {post.attachmentUrl && (
              <div className="pt-4 border-t border-gray-400">
                <a
                  href={post.attachmentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-4 rounded-lg bg-background-100 border border-gray-400 hover:border-gray-600 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gray-300 dark:bg-gray-800 text-gray-1000 border border-gray-400 flex items-center justify-center text-base shrink-0">
                      <Paperclip className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-xs sm:text-sm text-gray-1000 group-hover:text-gray-700 transition-colors">
                        {post.attachmentName || 'Attached Document'}
                      </div>
                      <div className="text-[11px] text-gray-600 font-sans">Click to view or download file</div>
                    </div>
                  </div>
                  <Download className="w-4 h-4 text-gray-600 group-hover:text-gray-1000 transition-colors" />
                </a>
              </div>
            )}

            {/* External Links */}
            {post.links && post.links.length > 0 && (
              <div className="pt-4 border-t border-gray-400 space-y-2">
                <h4 className="text-[10px] font-mono font-semibold uppercase tracking-wider text-gray-600">
                  Referenced Problem &amp; Preparation Links
                </h4>
                <div className="space-y-1.5">
                  {post.links.map((link, idx) => (
                    <a
                      key={idx}
                      href={link}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 text-xs text-blue-500 hover:underline font-mono truncate"
                    >
                      <ExternalLink className="w-3 h-3 shrink-0" />
                      <span className="truncate">{link}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="pt-4 border-t border-gray-400 flex items-center gap-2 flex-wrap">
                {post.tags.map((t, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-md bg-background-100 border border-gray-400 text-gray-700 font-mono text-xs"
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
          <div className="bg-background-200 border border-gray-400 rounded-xl p-6 md:p-8 shadow-2xs">
            <PlacementCommentSection
              postId={post._id}
              postAuthorId={post.author?._id || post.author}
              commentCount={post.commentCount}
            />
          </div>
        </div>
      </div>

      {/* Custom Delete Post Modal */}
      {showDeleteModal && (
        <div
          onClick={() => setShowDeleteModal(false)}
          className="fixed inset-0 bg-black/70 backdrop-blur-md z-[160] flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-background-100 border border-gray-400 rounded-xl p-6 max-w-sm w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 text-center text-gray-1000"
          >
            <div className="w-12 h-12 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 flex items-center justify-center text-xl mx-auto shadow-2xs">
              <Trash2 className="w-5 h-5" />
            </div>

            <div className="space-y-1.5">
              <h3 className="font-semibold text-base text-gray-1000 tracking-tight">Delete Experience Post?</h3>
              <p className="text-xs text-gray-700 font-sans leading-relaxed">
                Are you sure you want to delete this placement experience post and all associated discussion comments? This action cannot be undone.
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

      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-[150] flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-200"
        >
          <img
            src={selectedImage}
            alt="Fullscreen preview"
            className="max-w-full max-h-[90vh] rounded-xl object-contain shadow-2xl border border-gray-700"
          />
        </div>
      )}
    </>
  );
}
