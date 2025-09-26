/**
 * Comment routes
 */

import express from 'express';
import { Request, Response } from 'express';
import { catchAsync, createError } from '../middleware/errorHandler';
import { authenticate, optionalAuth } from '../middleware/auth';
import Comment from '../models/Comment';

const router = express.Router();

/**
 * @swagger
 * /api/comments:
 *   get:
 *     summary: Get comments with pagination
 *     tags: [Comments]
 *     parameters:
 *       - in: query
 *         name: article
 *         schema:
 *           type: string
 *         description: Filter by article ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Comments retrieved successfully
 */
router.get('/', optionalAuth, catchAsync(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const articleId = req.query.article as string;

  if (!articleId) {
    throw createError('Article ID is required', 400);
  }

  const comments = await (Comment as any).getArticleComments(articleId, page, limit);
  const total = await Comment.countDocuments({ article: articleId, parentComment: null });

  const response = {
    success: true,
    message: 'Comments retrieved successfully',
    data: {
      comments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  };

  res.status(200).json(response);
}));

/**
 * @swagger
 * /api/comments:
 *   post:
 *     summary: Create a new comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *               - article
 *             properties:
 *               content:
 *                 type: string
 *               article:
 *                 type: string
 *               parentComment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Comment created successfully
 *       400:
 *         description: Invalid input data
 */
router.post('/', authenticate, catchAsync(async (req: Request, res: Response) => {
  const { content, article, parentComment } = req.body;

  if (!content || !article) {
    throw createError('Content and article are required', 400);
  }

  const commentData: any = {
    content,
    article,
    author: req.user!._id
  };

  if (parentComment) {
    commentData.parentComment = parentComment;
  }

  const comment = await Comment.create(commentData);
  await comment.populate('author', 'username avatar');

  // If this is a reply, add it to the parent comment
  if (parentComment) {
    const parent = await Comment.findById(parentComment);
    if (parent) {
      parent.addReply(comment._id);
      await parent.save();
    }
  }

  const response = {
    success: true,
    message: 'Comment created successfully',
    data: {
      comment
    }
  };

  res.status(201).json(response);
}));

export default router;