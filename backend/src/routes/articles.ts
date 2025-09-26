/**
 * Article routes
 */

import express from 'express';
import { Request, Response } from 'express';
import { catchAsync, createError } from '../middleware/errorHandler';
import { authenticate, authorize, optionalAuth } from '../middleware/auth';
import Article from '../models/Article';
import { UserRole, ArticleStatus } from '../types';

const router = express.Router();

/**
 * @swagger
 * /api/articles:
 *   get:
 *     summary: Get all articles with pagination and filters
 *     tags: [Articles]
 *     parameters:
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
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, published, archived, pending_review]
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: author
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Articles retrieved successfully
 */
router.get('/', optionalAuth, catchAsync(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const status = req.query.status as ArticleStatus;
  const category = req.query.category as string;
  const author = req.query.author as string;
  const search = req.query.search as string;
  const skip = (page - 1) * limit;

  const filter: any = {};
  
  // Only show published articles to non-authenticated users or regular users
  if (!req.user || req.user.role === UserRole.READER) {
    filter.status = ArticleStatus.PUBLISHED;
  } else if (status) {
    filter.status = status;
  }

  if (category) filter.category = category;
  if (author) filter.author = author;
  
  let query = Article.find(filter);

  if (search) {
    query = (Article as any).search(search, filter);
  }

  const articles = await query
    .populate('author', 'username avatar')
    .skip(skip)
    .limit(limit)
    .sort({ publishedAt: -1, createdAt: -1 });

  const total = await Article.countDocuments(filter);

  const response = {
    success: true,
    message: 'Articles retrieved successfully',
    data: {
      articles,
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
 * /api/articles/{id}:
 *   get:
 *     summary: Get article by ID
 *     tags: [Articles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Article retrieved successfully
 *       404:
 *         description: Article not found
 */
router.get('/:id', optionalAuth, catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const article = await Article.findById(id)
    .populate('author', 'username avatar bio')
    .populate('comments');

  console.log('Backend: Fetched article:', article); // Add this line for debugging

  if (!article) {
    throw createError('Article not found', 404);
  }

  // Check if user can view this article
  if (article.status !== ArticleStatus.PUBLISHED) {
    if (!req.user || (req.user._id.toString() !== article.author._id.toString() && 
        req.user.role !== UserRole.ADMIN && req.user.role !== UserRole.EDITOR)) {
      throw createError('Article not found', 404);
    }
  }

  // Increment views (only for published articles)
  if (article.status === ArticleStatus.PUBLISHED) {
    article.incrementViews();
  }

  const response = {
    success: true,
    message: 'Article retrieved successfully',
    data: {
      article
    }
  };

  res.status(200).json(response);
}));

/**
 * @swagger
 * /api/articles:
 *   post:
 *     summary: Create a new article
 *     tags: [Articles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *               - category
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               summary:
 *                 type: string
 *               category:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               featuredImage:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [draft, published, pending_review]
 *     responses:
 *       201:
 *         description: Article created successfully
 *       400:
 *         description: Invalid input data
 *       403:
 *         description: Insufficient permissions
 */
router.post('/', authenticate, authorize(UserRole.WRITER, UserRole.EDITOR, UserRole.ADMIN),
  catchAsync(async (req: Request, res: Response) => {
    try {
      const { title, content, summary, category, tags, featuredImage, status } = req.body;

      if (!title || !content || !category) {
        throw createError('Title, content, and category are required', 400);
      }

      const articleData: any = {
        title,
        content,
        summary,
        category,
        tags: tags || [],
        author: req.user!._id,
        status: status || ArticleStatus.DRAFT
      };

      if (featuredImage) {
        articleData.featuredImage = featuredImage;
      }

      const article = await Article.create(articleData);
      await article.populate('author', 'username avatar');

      const response = {
        success: true,
        message: 'Article created successfully',
        data: {
          article
        }
      };

      res.status(201).json(response);
    } catch (error) {
      console.error('Backend: Error creating article:', error);
      throw error; // Re-throw to be caught by catchAsync and errorHandler
    }
  })
);

/**
 * @swagger
 * /api/articles/categories:
 *   get:
 *     summary: Get all unique article categories
 *     tags: [Articles]
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     categories:
 *                       type: array
 *                       items:
 *                         type: string
 */
router.get('/categories', catchAsync(async (req: Request, res: Response) => {
  const categories = await Article.distinct('category');
  res.status(200).json({
    success: true,
    message: 'Categories retrieved successfully',
    data: { categories }
  });
}));

/**
 * @swagger
 * /api/articles/{id}:
 *   put:
 *     summary: Update an article by ID
 *     tags: [Articles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Article'
 *     responses:
 *       200:
 *         description: Article updated successfully
 *       400:
 *         description: Invalid input data
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Article not found
 */
router.put('/:id', authenticate, authorize(UserRole.WRITER, UserRole.EDITOR, UserRole.ADMIN), catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, content, summary, category, tags, featuredImage, status } = req.body;

  let article = await Article.findById(id);

  if (!article) {
    throw createError('Article not found', 404);
  }

  // Check permissions
  if (!article.canBeEditedBy(req.user!._id.toString(), req.user!.role)) {
    throw createError('You are not authorized to edit this article', 403);
  }

  // Update fields
  if (title) article.title = title;
  if (content) article.content = content;
  if (summary) article.summary = summary;
  if (category) article.category = category;
  if (tags) article.tags = tags;
  if (featuredImage) article.featuredImage = featuredImage;
  if (status) {
    // Only Admin/Editor can change status freely, Writer can only set to DRAFT/PENDING_REVIEW
    if (req.user!.role === UserRole.WRITER && (status === ArticleStatus.PUBLISHED || status === ArticleStatus.ARCHIVED)) {
      throw createError('Writers cannot publish or archive articles directly', 403);
    }
    article.status = status;
  }

  article = await article.save();
  await article.populate('author', 'username avatar');

  const response = {
    success: true,
    message: 'Article updated successfully',
    data: {
      article
    }
  };

  res.status(200).json(response);
}));

export default router;