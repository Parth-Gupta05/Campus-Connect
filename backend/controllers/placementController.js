const PlacementPost = require('../models/PlacementPost');
const PlacementComment = require('../models/PlacementComment');
const User = require('../models/User');
const Notification = require('../models/Notification');
const cloudinary = require('cloudinary').v2;
const axios = require('axios');

// Helper to upload single file buffer to Cloudinary
const uploadToCloudinary = (fileBuffer, folder, resourceType = 'image') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: resourceType, folder: `campus_connect_placements/${folder}` },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    uploadStream.end(fileBuffer);
  });
};

// ==========================================
// 1. COMPANY SEARCH (Logo.dev Proxy)
// ==========================================
const getCompanySuggestions = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length === 0) {
      return res.json([]);
    }

    const secretKey = process.env.LOGO_DEV_SECRET_KEY || 'sk_atmRYA2zRda9tmfmOYCslw';
    const publishableKey = process.env.LOGO_DEV_PUBLISHABLE_KEY || 'pk_XLediPc6TBWJ1C52l9jc7w';

    const response = await axios.get(`https://api.logo.dev/search`, {
      params: {
        q: q.trim(),
        strategy: 'suggest'
      },
      headers: {
        Authorization: `Bearer ${secretKey}`
      },
      timeout: 5000
    });

    const suggestions = (response.data || []).map((item) => {
      let logoUrl = item.logo_url;
      if (!logoUrl && item.domain) {
        logoUrl = `https://img.logo.dev/${item.domain}?token=${publishableKey}&format=png`;
      } else if (logoUrl && !logoUrl.includes('token=') && publishableKey) {
        const separator = logoUrl.includes('?') ? '&' : '?';
        logoUrl = `${logoUrl}${separator}token=${publishableKey}`;
      }
      return {
        name: item.name,
        domain: item.domain,
        logoUrl: logoUrl
      };
    });

    res.json(suggestions);
  } catch (error) {
    console.error('Error fetching company suggestions from Logo.dev:', error.message);
    // Return empty array gracefully so UI can fallback to custom typing
    res.json([]);
  }
};

// ==========================================
// 2. GET FEED (Exhaustive Filters + Search + Sort + Pagination)
// ==========================================
const getFeed = async (req, res) => {
  try {
    const {
      company,
      postType,
      assessmentType,
      assessmentMode,
      interviewType,
      interviewMode,
      jobType,
      workMode,
      difficulty,
      outcome,
      branch,
      graduationYear,
      salaryMin,
      salaryMax,
      tags,
      search,
      sort = 'recent',
      cursor,
      page = 1,
      limit = 10,
      bookmarkedOnly,
      myPostsOnly
    } = req.query;

    const query = { isPublished: true };

    if (company) {
      query['company.name'] = { $regex: new RegExp(`^${company.trim()}$`, 'i') };
    }
    if (postType) {
      query.postType = postType;
    }
    if (assessmentType) {
      query.assessmentType = assessmentType;
    }
    if (assessmentMode) {
      query.assessmentMode = assessmentMode;
    }
    if (interviewType) {
      query.interviewType = interviewType;
    }
    if (interviewMode) {
      query.interviewMode = interviewMode;
    }
    if (jobType) {
      query.jobType = jobType;
    }
    if (workMode) {
      query.workMode = workMode;
    }
    if (difficulty) {
      query.difficulty = difficulty;
    }
    if (outcome) {
      query.outcome = outcome;
    }
    if (branch) {
      query.branch = { $regex: new RegExp(branch.trim(), 'i') };
    }
    if (graduationYear) {
      query.graduationYear = graduationYear.trim();
    }
    if (salaryMin || salaryMax) {
      query['salary.amount'] = {};
      if (salaryMin) query['salary.amount'].$gte = Number(salaryMin);
      if (salaryMax) query['salary.amount'].$lte = Number(salaryMax);
    }
    if (tags) {
      const tagList = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim()).filter(Boolean);
      if (tagList.length > 0) {
        query.tags = { $in: tagList };
      }
    }
    if (bookmarkedOnly === 'true' && req.user) {
      query.bookmarks = req.user.id;
    }
    if (myPostsOnly === 'true' && req.user) {
      query.author = req.user.id;
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: regex },
        { role: regex },
        { 'company.name': regex },
        { tags: regex }
      ];
    }

    // Sorting
    let sortOptions = { isPinned: -1, createdAt: -1 };
    if (sort === 'popular') {
      sortOptions = { isPinned: -1, viewCount: -1, createdAt: -1 };
    } else if (sort === 'most_commented') {
      sortOptions = { isPinned: -1, commentCount: -1, createdAt: -1 };
    } else if (sort === 'salary_high') {
      sortOptions = { isPinned: -1, 'salary.amount': -1, createdAt: -1 };
    }

    const numericLimit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 50);
    const numericPage = Math.max(parseInt(page, 10) || 1, 1);
    const skip = (numericPage - 1) * numericLimit;

    const [posts, totalCount] = await Promise.all([
      PlacementPost.find(query)
        .populate('author', 'name email avatarUrl branch graduationYear rollNo uid')
        .sort(sortOptions)
        .skip(skip)
        .limit(numericLimit)
        .lean(),
      PlacementPost.countDocuments(query)
    ]);

    const currentUserId = req.user ? req.user.id.toString() : null;

    const formattedPosts = posts.map(post => {
      const userReaction = currentUserId && post.reactions
        ? post.reactions.find(r => r.user && r.user.toString() === currentUserId)
        : null;

      const reactionCounts = (post.reactions || []).reduce((acc, r) => {
        acc[r.type] = (acc[r.type] || 0) + 1;
        return acc;
      }, {});

      return {
        ...post,
        isReactedByMe: !!userReaction,
        myReactionType: userReaction ? userReaction.type : null,
        isBookmarkedByMe: currentUserId && post.bookmarks
          ? post.bookmarks.some(b => b && b.toString() === currentUserId)
          : false,
        reactionCounts,
        totalReactions: (post.reactions || []).length
      };
    });

    res.json({
      posts: formattedPosts,
      totalCount,
      page: numericPage,
      totalPages: Math.ceil(totalCount / numericLimit),
      hasMore: skip + posts.length < totalCount
    });
  } catch (error) {
    console.error('Error in getFeed:', error);
    res.status(500).json({ message: 'Failed to fetch placement feed' });
  }
};

// ==========================================
// 3. GET SINGLE POST BY ID
// ==========================================
const getPostById = async (req, res) => {
  try {
    const post = await PlacementPost.findById(req.params.id)
      .populate('author', 'name email avatarUrl branch graduationYear rollNo uid linkedInUrl githubUsername leetcodeUsername')
      .lean();

    if (!post) {
      return res.status(404).json({ message: 'Placement post not found' });
    }

    // Asynchronously increment view count
    PlacementPost.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } }).exec();

    const currentUserId = req.user ? req.user.id.toString() : null;
    const userReaction = currentUserId && post.reactions
      ? post.reactions.find(r => r.user && r.user.toString() === currentUserId)
      : null;

    const reactionCounts = (post.reactions || []).reduce((acc, r) => {
      acc[r.type] = (acc[r.type] || 0) + 1;
      return acc;
    }, {});

    res.json({
      ...post,
      viewCount: post.viewCount + 1,
      isReactedByMe: !!userReaction,
      myReactionType: userReaction ? userReaction.type : null,
      isBookmarkedByMe: currentUserId && post.bookmarks
        ? post.bookmarks.some(b => b && b.toString() === currentUserId)
        : false,
      reactionCounts,
      totalReactions: (post.reactions || []).length
    });
  } catch (error) {
    console.error('Error in getPostById:', error);
    res.status(500).json({ message: 'Failed to fetch placement post details' });
  }
};

// ==========================================
// 4. CREATE PLACEMENT POST
// ==========================================
const createPost = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const {
      title,
      content,
      role,
      postType = 'interview_experience',
      companyName,
      companyDomain,
      companyLogoUrl,
      companyIsCustom,
      salaryAmount,
      salaryCurrency = 'INR',
      salaryPeriod = 'annual',
      assessmentType,
      assessmentMode,
      interviewType,
      interviewMode,
      numberOfRounds,
      difficulty,
      outcome,
      branch,
      graduationYear,
      jobType = 'full_time',
      workMode,
      location,
      tags,
      links,
      existingImages
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Post title is required' });
    }
    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Post content is required' });
    }
    if (!role || !role.trim()) {
      return res.status(400).json({ message: 'Role/Designation is required' });
    }
    if (!companyName || !companyName.trim()) {
      return res.status(400).json({ message: 'Company name is required' });
    }

    // Handle Image uploads (max 5)
    let imageUrls = [];
    if (existingImages) {
      try {
        const parsed = JSON.parse(existingImages);
        if (Array.isArray(parsed)) imageUrls = parsed;
      } catch (e) {
        if (typeof existingImages === 'string') imageUrls = [existingImages];
      }
    }

    if (req.files && req.files.images) {
      const filesToUpload = Array.isArray(req.files.images) ? req.files.images : [req.files.images];
      const remainingSlots = Math.max(0, 5 - imageUrls.length);
      const allowedFiles = filesToUpload.slice(0, remainingSlots);

      for (const file of allowedFiles) {
        const uploadResult = await uploadToCloudinary(file.buffer, 'images', 'image');
        imageUrls.push(uploadResult.secure_url);
      }
    }

    // Handle Document upload (1)
    let attachmentUrl = '';
    let attachmentName = '';
    if (req.files && req.files.document) {
      const docFile = Array.isArray(req.files.document) ? req.files.document[0] : req.files.document;
      const uploadResult = await uploadToCloudinary(docFile.buffer, 'docs', 'auto');
      attachmentUrl = uploadResult.secure_url;
      attachmentName = docFile.originalname || 'Attached Document';
    }

    // Parse tags & links
    let parsedTags = [];
    if (tags) {
      try {
        parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
      } catch (e) {
        parsedTags = tags.toString().split(',').map(t => t.trim()).filter(Boolean);
      }
    }

    let parsedLinks = [];
    if (links) {
      try {
        parsedLinks = typeof links === 'string' ? JSON.parse(links) : links;
      } catch (e) {
        parsedLinks = links.toString().split(',').map(l => l.trim()).filter(Boolean);
      }
    }

    const newPost = new PlacementPost({
      author: user._id,
      company: {
        name: companyName.trim(),
        domain: (companyDomain || '').trim(),
        logoUrl: companyLogoUrl || '',
        isCustom: companyIsCustom === 'true' || companyIsCustom === true
      },
      role: role.trim(),
      postType,
      salary: {
        amount: salaryAmount ? Number(salaryAmount) : null,
        currency: salaryCurrency || 'INR',
        period: salaryPeriod || 'annual'
      },
      assessmentType: assessmentType || null,
      assessmentMode: assessmentMode || null,
      interviewType: interviewType || null,
      interviewMode: interviewMode || null,
      numberOfRounds: numberOfRounds ? Number(numberOfRounds) : null,
      difficulty: difficulty || null,
      outcome: outcome || null,
      branch: (branch || user.branch || '').trim(),
      graduationYear: (graduationYear || user.graduationYear || '').trim(),
      jobType: jobType || 'full_time',
      workMode: workMode || null,
      location: (location || '').trim(),
      tags: parsedTags,
      title: title.trim(),
      content: content.trim(),
      images: imageUrls.slice(0, 5),
      attachmentUrl,
      attachmentName,
      links: parsedLinks,
      isPublished: true
    });

    await newPost.save();
    const populatedPost = await PlacementPost.findById(newPost._id)
      .populate('author', 'name email avatarUrl branch graduationYear rollNo uid')
      .lean();

    res.status(201).json({
      message: 'Placement experience posted successfully!',
      post: populatedPost
    });
  } catch (error) {
    console.error('Error creating placement post:', error);
    res.status(500).json({ message: 'Failed to create placement post' });
  }
};

// ==========================================
// 5. UPDATE PLACEMENT POST
// ==========================================
const updatePost = async (req, res) => {
  try {
    const post = await PlacementPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Placement post not found' });
    }

    if (post.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You are not authorized to edit this post' });
    }

    const {
      title,
      content,
      role,
      postType,
      companyName,
      companyDomain,
      companyLogoUrl,
      companyIsCustom,
      salaryAmount,
      salaryCurrency,
      salaryPeriod,
      assessmentType,
      assessmentMode,
      interviewType,
      interviewMode,
      numberOfRounds,
      difficulty,
      outcome,
      branch,
      graduationYear,
      jobType,
      workMode,
      location,
      tags,
      links,
      existingImages,
      removeAttachment
    } = req.body;

    if (title) post.title = title.trim();
    if (content) post.content = content.trim();
    if (role) post.role = role.trim();
    if (postType) post.postType = postType;

    if (companyName) {
      post.company.name = companyName.trim();
      post.company.domain = (companyDomain || '').trim();
      post.company.logoUrl = companyLogoUrl || '';
      post.company.isCustom = companyIsCustom === 'true' || companyIsCustom === true;
    }

    if (salaryAmount !== undefined) {
      post.salary.amount = salaryAmount ? Number(salaryAmount) : null;
      if (salaryCurrency) post.salary.currency = salaryCurrency;
      if (salaryPeriod) post.salary.period = salaryPeriod;
    }

    if (assessmentType !== undefined) post.assessmentType = assessmentType || null;
    if (assessmentMode !== undefined) post.assessmentMode = assessmentMode || null;
    if (interviewType !== undefined) post.interviewType = interviewType || null;
    if (interviewMode !== undefined) post.interviewMode = interviewMode || null;
    if (numberOfRounds !== undefined) post.numberOfRounds = numberOfRounds ? Number(numberOfRounds) : null;
    if (difficulty !== undefined) post.difficulty = difficulty || null;
    if (outcome !== undefined) post.outcome = outcome || null;
    if (branch !== undefined) post.branch = (branch || '').trim();
    if (graduationYear !== undefined) post.graduationYear = (graduationYear || '').trim();
    if (jobType !== undefined) post.jobType = jobType || 'full_time';
    if (workMode !== undefined) post.workMode = workMode || null;
    if (location !== undefined) post.location = (location || '').trim();

    if (tags) {
      try {
        post.tags = typeof tags === 'string' ? JSON.parse(tags) : tags;
      } catch (e) {
        post.tags = tags.toString().split(',').map(t => t.trim()).filter(Boolean);
      }
    }

    if (links) {
      try {
        post.links = typeof links === 'string' ? JSON.parse(links) : links;
      } catch (e) {
        post.links = links.toString().split(',').map(l => l.trim()).filter(Boolean);
      }
    }

    // Update images
    let updatedImages = [];
    if (existingImages) {
      try {
        updatedImages = JSON.parse(existingImages);
      } catch (e) {
        updatedImages = Array.isArray(existingImages) ? existingImages : [existingImages];
      }
    } else {
      updatedImages = post.images || [];
    }

    if (req.files && req.files.images) {
      const filesToUpload = Array.isArray(req.files.images) ? req.files.images : [req.files.images];
      const remainingSlots = Math.max(0, 5 - updatedImages.length);
      for (const file of filesToUpload.slice(0, remainingSlots)) {
        const uploadResult = await uploadToCloudinary(file.buffer, 'images', 'image');
        updatedImages.push(uploadResult.secure_url);
      }
    }
    post.images = updatedImages.slice(0, 5);

    // Update Attachment
    if (removeAttachment === 'true' || removeAttachment === true) {
      post.attachmentUrl = '';
      post.attachmentName = '';
    }
    if (req.files && req.files.document) {
      const docFile = Array.isArray(req.files.document) ? req.files.document[0] : req.files.document;
      const uploadResult = await uploadToCloudinary(docFile.buffer, 'docs', 'auto');
      post.attachmentUrl = uploadResult.secure_url;
      post.attachmentName = docFile.originalname || 'Attached Document';
    }

    await post.save();
    const updatedPost = await PlacementPost.findById(post._id)
      .populate('author', 'name email avatarUrl branch graduationYear rollNo uid')
      .lean();

    res.json({ message: 'Post updated successfully', post: updatedPost });
  } catch (error) {
    console.error('Error updating placement post:', error);
    res.status(500).json({ message: 'Failed to update placement post' });
  }
};

// ==========================================
// 6. DELETE PLACEMENT POST
// ==========================================
const deletePost = async (req, res) => {
  try {
    const post = await PlacementPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Placement post not found' });
    }

    if (post.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You are not authorized to delete this post' });
    }

    // Delete post & its associated comments
    await Promise.all([
      PlacementPost.findByIdAndDelete(req.params.id),
      PlacementComment.deleteMany({ post: req.params.id })
    ]);

    res.json({ message: 'Placement post and comments deleted successfully' });
  } catch (error) {
    console.error('Error deleting placement post:', error);
    res.status(500).json({ message: 'Failed to delete post' });
  }
};

// ==========================================
// 7. TOGGLE REACTION (React Icons Based: helpful, insightful, celebrate, like)
// ==========================================
const toggleReaction = async (req, res) => {
  try {
    const { type } = req.body;
    const validTypes = ['helpful', 'insightful', 'celebrate', 'like'];
    if (!type || !validTypes.includes(type)) {
      return res.status(400).json({ message: 'Invalid reaction type' });
    }

    const post = await PlacementPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Placement post not found' });
    }

    const userId = req.user.id.toString();
    const existingIndex = post.reactions.findIndex(r => r.user.toString() === userId);

    let userReactionType = null;
    let isNewReaction = false;

    if (existingIndex !== -1) {
      if (post.reactions[existingIndex].type === type) {
        // Remove reaction (toggle off)
        post.reactions.splice(existingIndex, 1);
        userReactionType = null;
      } else {
        // Change reaction type
        post.reactions[existingIndex].type = type;
        post.reactions[existingIndex].createdAt = new Date();
        userReactionType = type;
      }
    } else {
      // Add new reaction
      post.reactions.push({ user: req.user.id, type, createdAt: new Date() });
      userReactionType = type;
      isNewReaction = true;
    }

    await post.save();

    // Trigger notification if it's a new reaction and author != actor
    if (isNewReaction && post.author.toString() !== userId) {
      try {
        const actor = await User.findById(req.user.id).select('name');
        await Notification.create({
          recipient: post.author,
          recipientModel: 'User',
          sender: req.user.id,
          senderModel: 'User',
          type: 'placement_reaction',
          title: 'Reaction on your post',
          message: `${actor?.name || 'Someone'} reacted with ${type} to your post "${post.title.substring(0, 35)}..."`,
          link: `/placements/${post._id}`
        });
      } catch (notifErr) {
        console.error('Notification error on reaction:', notifErr);
      }
    }

    const reactionCounts = post.reactions.reduce((acc, r) => {
      acc[r.type] = (acc[r.type] || 0) + 1;
      return acc;
    }, {});

    res.json({
      myReactionType: userReactionType,
      isReactedByMe: !!userReactionType,
      reactionCounts,
      totalReactions: post.reactions.length
    });
  } catch (error) {
    console.error('Error toggling reaction:', error);
    res.status(500).json({ message: 'Failed to update reaction' });
  }
};

// ==========================================
// 8. TOGGLE BOOKMARK / SAVE
// ==========================================
const toggleBookmark = async (req, res) => {
  try {
    const post = await PlacementPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Placement post not found' });
    }

    const userId = req.user.id.toString();
    const isBookmarked = post.bookmarks.some(b => b.toString() === userId);

    if (isBookmarked) {
      post.bookmarks = post.bookmarks.filter(b => b.toString() !== userId);
    } else {
      post.bookmarks.push(req.user.id);
    }

    await post.save();

    res.json({
      isBookmarkedByMe: !isBookmarked,
      bookmarksCount: post.bookmarks.length,
      message: !isBookmarked ? 'Post saved to your bookmarks' : 'Post removed from bookmarks'
    });
  } catch (error) {
    console.error('Error toggling bookmark:', error);
    res.status(500).json({ message: 'Failed to bookmark post' });
  }
};

// ==========================================
// 9. GET COMMENTS (Threaded / YouTube Nesting Format)
// ==========================================
const getComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const { parentCommentId } = req.query;

    const query = { post: postId };
    if (parentCommentId === 'null' || !parentCommentId) {
      query.parentComment = null; // Top level comments
    } else {
      query.parentComment = parentCommentId; // Nested replies
    }

    const comments = await PlacementComment.find(query)
      .populate('author', 'name email avatarUrl branch graduationYear rollNo uid')
      .sort({ createdAt: 1 })
      .lean();

    res.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ message: 'Failed to fetch comments' });
  }
};

// ==========================================
// 10. ADD COMMENT OR NESTED REPLY
// ==========================================
const addComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content, parentCommentId } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Comment content cannot be empty' });
    }

    const post = await PlacementPost.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Placement post not found' });
    }

    let depth = 0;
    let parentComment = null;

    if (parentCommentId) {
      parentComment = await PlacementComment.findById(parentCommentId);
      if (!parentComment) {
        return res.status(404).json({ message: 'Parent comment not found' });
      }
      depth = Math.min((parentComment.depth || 0) + 1, 5); // Capped at depth 5
    }

    const comment = new PlacementComment({
      post: postId,
      author: req.user.id,
      content: content.trim(),
      parentComment: parentCommentId || null,
      depth,
      replyCount: 0
    });

    await comment.save();

    // Increment post commentCount & parent replyCount
    post.commentCount = (post.commentCount || 0) + 1;
    await post.save();

    if (parentComment) {
      parentComment.replyCount = (parentComment.replyCount || 0) + 1;
      await parentComment.save();
    }

    const populatedComment = await PlacementComment.findById(comment._id)
      .populate('author', 'name email avatarUrl branch graduationYear rollNo uid')
      .lean();

    // Send notifications
    const actor = await User.findById(req.user.id).select('name');
    const actorName = actor?.name || 'Someone';

    // If top level comment -> notify post author
    if (!parentCommentId && post.author.toString() !== req.user.id) {
      await Notification.create({
        recipient: post.author,
        recipientModel: 'User',
        sender: req.user.id,
        senderModel: 'User',
        type: 'placement_comment',
        title: 'New comment on your placement post',
        message: `${actorName} commented: "${content.trim().substring(0, 45)}..."`,
        link: `/placements/${post._id}`
      });
    } else if (parentComment) {
      // If reply -> notify parent comment author
      if (parentComment.author.toString() !== req.user.id) {
        await Notification.create({
          recipient: parentComment.author,
          recipientModel: 'User',
          sender: req.user.id,
          senderModel: 'User',
          type: 'placement_reply',
          title: 'Reply to your comment',
          message: `${actorName} replied: "${content.trim().substring(0, 45)}..."`,
          link: `/placements/${post._id}`
        });
      }
      // Also notify post author if they are not the parent comment author or the actor
      if (post.author.toString() !== req.user.id && post.author.toString() !== parentComment.author.toString()) {
        await Notification.create({
          recipient: post.author,
          recipientModel: 'User',
          sender: req.user.id,
          senderModel: 'User',
          type: 'placement_comment',
          title: 'New reply on your placement post',
          message: `${actorName} replied on your post "${post.title.substring(0, 30)}..."`,
          link: `/placements/${post._id}`
        });
      }
    }

    res.status(201).json({
      message: 'Comment added successfully',
      comment: populatedComment
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Failed to add comment' });
  }
};

// ==========================================
// 11. DELETE COMMENT
// ==========================================
const deleteComment = async (req, res) => {
  try {
    const comment = await PlacementComment.findById(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (comment.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized to delete comment' });
    }

    const postId = comment.post;
    const parentCommentId = comment.parentComment;

    // Delete comment and any nested child replies
    const childComments = await PlacementComment.find({ parentComment: comment._id });
    const totalDeleted = 1 + childComments.length;

    await PlacementComment.deleteMany({
      $or: [{ _id: comment._id }, { parentComment: comment._id }]
    });

    // Decrement post commentCount
    await PlacementPost.findByIdAndUpdate(postId, {
      $inc: { commentCount: -totalDeleted }
    });

    if (parentCommentId) {
      await PlacementComment.findByIdAndUpdate(parentCommentId, {
        $inc: { replyCount: -1 }
      });
    }

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ message: 'Failed to delete comment' });
  }
};

// ==========================================
// 12. GET USER POSTS (For Student Profile section)
// ==========================================
const getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const posts = await PlacementPost.find({ author: userId, isPublished: true })
      .populate('author', 'name email avatarUrl branch graduationYear')
      .sort({ createdAt: -1 })
      .lean();

    const currentUserId = req.user ? req.user.id.toString() : null;
    const formatted = posts.map(p => ({
      ...p,
      isBookmarkedByMe: currentUserId && p.bookmarks
        ? p.bookmarks.some(b => b && b.toString() === currentUserId)
        : false,
      totalReactions: (p.reactions || []).length
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching user placement posts:', error);
    res.status(500).json({ message: 'Failed to fetch user placement posts' });
  }
};

// ==========================================
// 13. GET FILTER METADATA (Distinct tags, branches, companies, roles)
// ==========================================
const getFilterMeta = async (req, res) => {
  try {
    const [companies, branches, years, tags] = await Promise.all([
      PlacementPost.distinct('company.name', { isPublished: true }),
      PlacementPost.distinct('branch', { isPublished: true, branch: { $ne: '' } }),
      PlacementPost.distinct('graduationYear', { isPublished: true, graduationYear: { $ne: '' } }),
      PlacementPost.distinct('tags', { isPublished: true })
    ]);

    res.json({
      companies: companies.filter(Boolean).sort(),
      branches: branches.filter(Boolean).sort(),
      graduationYears: years.filter(Boolean).sort(),
      tags: tags.filter(Boolean).sort()
    });
  } catch (error) {
    console.error('Error getting filter metadata:', error);
    res.status(500).json({ message: 'Failed to get filter metadata' });
  }
};

module.exports = {
  getCompanySuggestions,
  getFeed,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  toggleReaction,
  toggleBookmark,
  getComments,
  addComment,
  deleteComment,
  getUserPosts,
  getFilterMeta
};
