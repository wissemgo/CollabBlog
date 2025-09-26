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
const commentSchema = new mongoose_1.Schema({
    content: {
        type: String,
        required: [true, 'Comment content is required'],
        trim: true,
        minLength: [1, 'Comment cannot be empty'],
        maxLength: [2000, 'Comment cannot exceed 2000 characters']
    },
    author: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Comment author is required'],
        index: true
    },
    article: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Article',
        required: [true, 'Article reference is required'],
        index: true
    },
    parentComment: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Comment',
        default: null,
        index: true
    },
    replies: {
        type: [mongoose_1.Schema.Types.ObjectId],
        ref: 'Comment',
        default: [],
        validate: {
            validator: function (replies) {
                return replies.length <= 100;
            },
            message: 'Comment cannot have more than 100 replies'
        }
    },
    likes: {
        type: [mongoose_1.Schema.Types.ObjectId],
        ref: 'User',
        default: [],
        index: true
    },
    isEdited: {
        type: Boolean,
        default: false
    },
    editedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
commentSchema.index({ article: 1, createdAt: -1 });
commentSchema.index({ author: 1, createdAt: -1 });
commentSchema.index({ parentComment: 1, createdAt: 1 });
commentSchema.index({ article: 1, parentComment: 1 });
commentSchema.pre('save', function (next) {
    if (this.isModified('content') && !this.isNew) {
        this.isEdited = true;
        this.editedAt = new Date();
    }
    next();
});
commentSchema.post('save', async function () {
    if (this.isNew && !this.parentComment) {
        await mongoose_1.default.model('Article').findByIdAndUpdate(this.article, { $inc: { commentsCount: 1 } });
    }
});
commentSchema.post('findOneAndDelete', async function (doc) {
    if (doc && !doc.parentComment) {
        await mongoose_1.default.model('Article').findByIdAndUpdate(doc.article, { $inc: { commentsCount: -1 } });
    }
    if (doc && doc.replies.length > 0) {
        await mongoose_1.default.model('Comment').deleteMany({
            _id: { $in: doc.replies }
        });
    }
});
commentSchema.methods.toggleLike = function (userId) {
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
commentSchema.methods.canBeEditedBy = function (userId, userRole) {
    if (userRole === 'admin' || userRole === 'editor') {
        return true;
    }
    if (this.author.toString() === userId) {
        const twentyFourHours = 24 * 60 * 60 * 1000;
        const now = new Date().getTime();
        const createdTime = new Date(this.createdAt).getTime();
        return (now - createdTime) <= twentyFourHours;
    }
    return false;
};
commentSchema.methods.canBeDeletedBy = function (userId, userRole) {
    if (userRole === 'admin') {
        return true;
    }
    if (userRole === 'editor') {
        return true;
    }
    if (this.author.toString() === userId) {
        return true;
    }
    return false;
};
commentSchema.methods.addReply = function (replyId) {
    if (!this.replies.includes(replyId)) {
        this.replies.push(new mongoose_1.default.Types.ObjectId(replyId));
    }
};
commentSchema.methods.removeReply = function (replyId) {
    this.replies = this.replies.filter((id) => id.toString() !== replyId);
};
commentSchema.statics.getArticleComments = function (articleId, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc') {
    const skip = (page - 1) * limit;
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    return this.find({
        article: articleId,
        parentComment: null
    })
        .populate('author', 'username avatar')
        .populate({
        path: 'replies',
        populate: {
            path: 'author',
            select: 'username avatar'
        },
        options: { sort: { createdAt: 1 } }
    })
        .sort(sort)
        .skip(skip)
        .limit(limit);
};
commentSchema.statics.getStatistics = async function () {
    const stats = await this.aggregate([
        {
            $group: {
                _id: null,
                totalComments: { $sum: 1 },
                totalReplies: {
                    $sum: { $cond: [{ $ne: ['$parentComment', null] }, 1, 0] }
                },
                totalTopLevel: {
                    $sum: { $cond: [{ $eq: ['$parentComment', null] }, 1, 0] }
                },
                totalLikes: { $sum: { $size: '$likes' } },
                averageLikes: { $avg: { $size: '$likes' } }
            }
        }
    ]);
    return stats[0] || {
        totalComments: 0,
        totalReplies: 0,
        totalTopLevel: 0,
        totalLikes: 0,
        averageLikes: 0
    };
};
commentSchema.statics.getMostLiked = function (limit = 10) {
    return this.find()
        .populate('author', 'username avatar')
        .populate('article', 'title')
        .sort({ likes: -1 })
        .limit(limit);
};
commentSchema.statics.getRecent = function (limit = 10) {
    return this.find()
        .populate('author', 'username avatar')
        .populate('article', 'title')
        .sort({ createdAt: -1 })
        .limit(limit);
};
commentSchema.virtual('likesCount').get(function () {
    return this.likes.length;
});
commentSchema.virtual('repliesCount').get(function () {
    return this.replies.length;
});
commentSchema.virtual('depth').get(function () {
    return this.parentComment ? 1 : 0;
});
commentSchema.virtual('url').get(function () {
    return `/api/comments/${this._id}`;
});
const Comment = mongoose_1.default.model('Comment', commentSchema);
exports.default = Comment;
//# sourceMappingURL=Comment.js.map