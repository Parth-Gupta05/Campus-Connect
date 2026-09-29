const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authMiddleware } = require('../middleware/authMiddleware');
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
  getSingleComment,
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

// Search & metadata
router.get('/companies/search', authMiddleware, getCompanySuggestions);
router.get('/filters/meta', authMiddleware, getFilterMeta);

// Feed & Posts
router.get('/', authMiddleware, getFeed);
router.get('/user/:userId', authMiddleware, getUserPosts);
router.get('/:id', authMiddleware, getPostById);

router.post('/', authMiddleware, uploadFields, createPost);
router.put('/:id', authMiddleware, uploadFields, updatePost);
router.delete('/:id', authMiddleware, deletePost);

// Reactions & Bookmarks
router.post('/:id/react', authMiddleware, toggleReaction);
router.post('/:id/bookmark', authMiddleware, toggleBookmark);

// Comments & Replies
router.get('/:postId/comments', authMiddleware, getComments);
router.get('/:postId/comments/:commentId', authMiddleware, getSingleComment);
router.post('/:postId/comments', authMiddleware, addComment);
router.delete('/comments/:commentId', authMiddleware, deleteComment);

module.exports = router;
