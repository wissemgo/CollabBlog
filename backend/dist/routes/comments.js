"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const errorHandler_1 = require("../middleware/errorHandler");
const auth_1 = require("../middleware/auth");
const Comment_1 = __importDefault(require("../models/Comment"));
const router = express_1.default.Router();
router.get('/', auth_1.optionalAuth, (0, errorHandler_1.catchAsync)(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const articleId = req.query.article;
    if (!articleId) {
        throw (0, errorHandler_1.createError)('Article ID is required', 400);
    }
    const comments = await Comment_1.default.getArticleComments(articleId, page, limit);
    const total = await Comment_1.default.countDocuments({ article: articleId, parentComment: null });
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
router.post('/', auth_1.authenticate, (0, errorHandler_1.catchAsync)(async (req, res) => {
    const { content, article, parentComment } = req.body;
    if (!content || !article) {
        throw (0, errorHandler_1.createError)('Content and article are required', 400);
    }
    const commentData = {
        content,
        article,
        author: req.user._id
    };
    if (parentComment) {
        commentData.parentComment = parentComment;
    }
    const comment = await Comment_1.default.create(commentData);
    await comment.populate('author', 'username avatar');
    if (parentComment) {
        const parent = await Comment_1.default.findById(parentComment);
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
exports.default = router;
//# sourceMappingURL=comments.js.map