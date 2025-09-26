"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const errorHandler_1 = require("../middleware/errorHandler");
const auth_1 = require("../middleware/auth");
const Article_1 = __importDefault(require("../models/Article"));
const types_1 = require("../types");
const router = express_1.default.Router();
router.get('/', auth_1.optionalAuth, (0, errorHandler_1.catchAsync)(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status;
    const category = req.query.category;
    const author = req.query.author;
    const search = req.query.search;
    const skip = (page - 1) * limit;
    const filter = {};
    if (!req.user || req.user.role === types_1.UserRole.READER) {
        filter.status = types_1.ArticleStatus.PUBLISHED;
    }
    else if (status) {
        filter.status = status;
    }
    if (category)
        filter.category = category;
    if (author)
        filter.author = author;
    let query = Article_1.default.find(filter);
    if (search) {
        query = Article_1.default.search(search, filter);
    }
    const articles = await query
        .populate('author', 'username avatar')
        .skip(skip)
        .limit(limit)
        .sort({ publishedAt: -1, createdAt: -1 });
    const total = await Article_1.default.countDocuments(filter);
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
router.get('/:id', auth_1.optionalAuth, (0, errorHandler_1.catchAsync)(async (req, res) => {
    const { id } = req.params;
    const article = await Article_1.default.findById(id)
        .populate('author', 'username avatar bio')
        .populate('comments');
    if (!article) {
        throw (0, errorHandler_1.createError)('Article not found', 404);
    }
    if (article.status !== types_1.ArticleStatus.PUBLISHED) {
        if (!req.user || (req.user._id.toString() !== article.author._id.toString() &&
            req.user.role !== types_1.UserRole.ADMIN && req.user.role !== types_1.UserRole.EDITOR)) {
            throw (0, errorHandler_1.createError)('Article not found', 404);
        }
    }
    if (article.status === types_1.ArticleStatus.PUBLISHED) {
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
router.post('/', auth_1.authenticate, (0, auth_1.authorize)(types_1.UserRole.WRITER, types_1.UserRole.EDITOR, types_1.UserRole.ADMIN), (0, errorHandler_1.catchAsync)(async (req, res) => {
    const { title, content, summary, category, tags, featuredImage, status } = req.body;
    if (!title || !content || !category) {
        throw (0, errorHandler_1.createError)('Title, content, and category are required', 400);
    }
    const articleData = {
        title,
        content,
        summary,
        category,
        tags: tags || [],
        author: req.user._id,
        status: status || types_1.ArticleStatus.DRAFT
    };
    if (featuredImage) {
        articleData.featuredImage = featuredImage;
    }
    const article = await Article_1.default.create(articleData);
    await article.populate('author', 'username avatar');
    const response = {
        success: true,
        message: 'Article created successfully',
        data: {
            article
        }
    };
    res.status(201).json(response);
}));
exports.default = router;
//# sourceMappingURL=articles.js.map