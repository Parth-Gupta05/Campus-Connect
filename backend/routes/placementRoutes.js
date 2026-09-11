const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authMiddleware, optionalAuthMiddleware } = require('../middleware/authMiddleware');
const {
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
} = require('../controllers/placementController');

// Multer memory storage for uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

const uploadFields = upload.fields([
  { name: 'images', maxCount: 5 },
  { name: 'document', maxCount: 1 }
]);

// Public / Authenticated search & metadata
router.get('/companies/search', getCompanySuggestions);
router.get('/filters/meta', getFilterMeta);

// Feed & Posts
router.get('/', optionalAuthMiddleware, getFeed);
router.get('/user/:userId', optionalAuthMiddleware, getUserPosts);
router.get('/:id', optionalAuthMiddleware, getPostById);

router.post('/', authMiddleware, uploadFields, createPost);
router.put('/:id', authMiddleware, uploadFields, updatePost);
router.delete('/:id', authMiddleware, deletePost);

// Reactions & Bookmarks
router.post('/:id/react', authMiddleware, toggleReaction);
router.post('/:id/bookmark', authMiddleware, toggleBookmark);

// Comments & Replies
router.get('/:postId/comments', getComments);
router.post('/:postId/comments', authMiddleware, addComment);
router.delete('/comments/:commentId', authMiddleware, deleteComment);

module.exports = router;
