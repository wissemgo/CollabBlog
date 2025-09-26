"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const types_1 = require("../types");
const articleSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: [true, 'Article title is required'],
        trim: true,
        minLength: [5, 'Title must be at least 5 characters'],
        maxLength: [200, 'Title cannot exceed 200 characters'],
        index: 'text'
    },
    content: {
        type: String,
        required: [true, 'Article content is required'],
        minLength: [100, 'Content must be at least 100 characters'],
        index: 'text'
    },
    summary: {
        type: String,
        required: [true, 'Article summary is required'],
        trim: true,
        maxLength: [500, 'Summary cannot exceed 500 characters']
    },
    author: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Article author is required'],
        index: true
    },
    tags: {
        type: [String],
        default: [],
        validate: {
            validator: function (tags) {
                return tags.length <= 10;
            },
            message: 'Article cannot have more than 10 tags'
        },
        index: true
    },
    category: {
        type: String,
        required: [true, 'Article category is required'],
        trim: true,
        maxLength: [50, 'Category cannot exceed 50 characters'],
        index: true
    },
    featuredImage: {
        type: String,
        default: null,
        validate: {
            validator: function (url) {
                if (!url)
                    return true;
                return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(url);
            },
            message: 'Featured image must be a valid image URL'
        }
    },
    status: {
        type: String,
        enum: Object.values(types_1.ArticleStatus),
        default: types_1.ArticleStatus.DRAFT,
        required: true,
        index: true
    },
    likes: {
        type: [mongoose_1.Schema.Types.ObjectId],
        ref: 'User',
        default: [],
        index: true
    },
    views: {
        type: Number,
        default: 0,
        min: 0
    },
    commentsCount: {
        type: Number,
        default: 0,
        min: 0
    },
    isPublished: {
        type: Boolean,
        default: false,
        index: true
    },
    publishedAt: {
        type: Date,
        default: null,
        index: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
articleSchema.index({ author: 1, status: 1 });
articleSchema.index({ status: 1, publishedAt: -1 });
articleSchema.index({ category: 1, status: 1 });
articleSchema.index({ tags: 1, status: 1 });
articleSchema.index({ title: 'text', content: 'text', summary: 'text' });
articleSchema.index({ createdAt: -1 });
articleSchema.index({ views: -1 });
articleSchema.index({ likes: -1 });
articleSchema.pre('save', function (next) {
    if (this.isModified('status') && this.status === types_1.ArticleStatus.PUBLISHED && !this.publishedAt) {
        this.publishedAt = new Date();
        this.isPublished = true;
    }
    if (!this.summary && this.content) {
        const plainText = this.content.replace(/<[^>]*>/g, '');
        this.summary = plainText.substring(0, 200) + (plainText.length > 200 ? '...' : '');
    }
    next();
});
articleSchema.methods.incrementViews = function () {
    this.views += 1;
    this.save();
};
articleSchema.methods.toggleLike = function (userId) {
    const userObjectId = new mongoose_1.default.Types.ObjectId(userId);
    const likeIndex = this.likes.indexOf(userObjectId);
    if (likeIndex > -1) {
        this.likes.splice(likeIndex, 1);
        return { liked: false, likesCount: this.likes.length };
    }
    else {
        this.likes.push(userObjectId);
        return { liked: true, likesCount: this.likes.length };
    }
};
articleSchema.methods.canBeEditedBy = function (userId, userRole) {
    if (userRole === 'admin' || userRole === 'editor') {
        return true;
    }
    if (userRole === 'writer') {
        return this.author.toString() === userId;
    }
    return false;
};
articleSchema.methods.getReadingTime = function () {
    const wordsPerMinute = 200;
    const plainText = this.content.replace(/<[^>]*>/g, '');
    const wordCount = plainText.trim().split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
};
articleSchema.statics.getPopular = function (limit = 10) {
    return this.find({ status: types_1.ArticleStatus.PUBLISHED })
        .sort({ views: -1, likes: -1 })
        .limit(limit)
        .populate('author', 'username avatar')
        .select('title summary featuredImage views likes createdAt author');
};
articleSchema.statics.getRecent = function (limit = 10) {
    return this.find({ status: types_1.ArticleStatus.PUBLISHED })
        .sort({ publishedAt: -1 })
        .limit(limit)
        .populate('author', 'username avatar')
        .select('title summary featuredImage views likes publishedAt author');
};
articleSchema.statics.search = function (query, filters = {}) {
    const searchQuery = {
        $and: [
            { status: types_1.ArticleStatus.PUBLISHED },
            {
                $or: [
                    { $text: { $search: query } },
                    { title: { $regex: query, $options: 'i' } },
                    { summary: { $regex: query, $options: 'i' } },
                    { tags: { $in: [new RegExp(query, 'i')] } }
                ]
            }
        ]
    };
    if (filters.category) {
        searchQuery.$and.push({ category: filters.category });
    }
    if (filters.author) {
        searchQuery.$and.push({ author: filters.author });
    }
    if (filters.tags && filters.tags.length > 0) {
        searchQuery.$and.push({ tags: { $in: filters.tags } });
    }
    return this.find(searchQuery)
        .populate('author', 'username avatar')
        .sort({ score: { $meta: 'textScore' }, publishedAt: -1 });
};
articleSchema.statics.getStatistics = async function () {
    const stats = await this.aggregate([
        {
            $group: {
                _id: null,
                totalArticles: { $sum: 1 },
                publishedArticles: {
                    $sum: { $cond: [{ $eq: ['$status', types_1.ArticleStatus.PUBLISHED] }, 1, 0] }
                },
                draftArticles: {
                    $sum: { $cond: [{ $eq: ['$status', types_1.ArticleStatus.DRAFT] }, 1, 0] }
                },
                totalViews: { $sum: '$views' },
                totalLikes: { $sum: { $size: '$likes' } },
                averageViews: { $avg: '$views' }
            }
        }
    ]);
    return stats[0] || {
        totalArticles: 0,
        publishedArticles: 0,
        draftArticles: 0,
        totalViews: 0,
        totalLikes: 0,
        averageViews: 0
    };
};
articleSchema.virtual('likesCount').get(function () {
    return this.likes.length;
});
articleSchema.virtual('readingTime').get(function () {
    return this.getReadingTime();
});
articleSchema.virtual('url').get(function () {
    return `/api/articles/${this._id}`;
});
articleSchema.virtual('comments', {
    ref: 'Comment',
    localField: '_id',
    foreignField: 'article'
});
const Article = mongoose_1.default.model('Article', articleSchema);
exports.default = Article;
//# sourceMappingURL=Article.js.map