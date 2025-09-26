/**
 * Comment Model - MongoDB Schema for article comments
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IComment extends Document {
  _id: string;
  content: string;
  author: mongoose.Types.ObjectId;
  article: mongoose.Types.ObjectId;
  parentComment?: mongoose.Types.ObjectId;
  replies: mongoose.Types.ObjectId[];
  likes: mongoose.Types.ObjectId[];
  isEdited: boolean;
  editedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  toggleLike(userId: string): { liked: boolean; likesCount: number };
  canBeEditedBy(userId: string, userRole: string): boolean;
  canBeDeletedBy(userId: string, userRole: string): boolean;
  addReply(replyId: string): void;
  removeReply(replyId: string): void;
}

/**
 * @swagger
 * components:
 *   schemas:
 *     Comment:
 *       type: object
 *       required:
 *         - content
 *         - author
 *         - article
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique identifier for the comment
 *         content:
 *           type: string
 *           description: Comment content
 *           minLength: 1
 *           maxLength: 2000
 *         author:
 *           type: string
 *           description: ID of the comment author
 *         article:
 *           type: string
 *           description: ID of the article being commented on
 *         parentComment:
 *           type: string
 *           description: ID of the parent comment (for replies)
 *         replies:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of reply comment IDs
 *         likes:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of user IDs who liked the comment
 *         isEdited:
 *           type: boolean
 *           description: Whether the comment has been edited
 *         editedAt:
 *           type: string
 *           format: date-time
 *           description: Last edit timestamp
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 */

const commentSchema = new Schema<IComment>(
  {
    content: {
      type: String,
      required: [true, 'Comment content is required'],
      trim: true,
      minLength: [1, 'Comment cannot be empty'],
      maxLength: [2000, 'Comment cannot exceed 2000 characters']
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Comment author is required'],
      index: true
    },
    article: {
      type: Schema.Types.ObjectId,
      ref: 'Article',
      required: [true, 'Article reference is required'],
      index: true
    },
    parentComment: {
      type: Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
      index: true
    },
    replies: {
      type: [Schema.Types.ObjectId],
      ref: 'Comment',
      default: [],
      validate: {
        validator: function(replies: mongoose.Types.ObjectId[]) {
          return replies.length <= 100; // Limit replies to prevent deep nesting
        },
        message: 'Comment cannot have more than 100 replies'
      }
    },
    likes: {
      type: [Schema.Types.ObjectId],
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
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Compound indexes for better query performance
commentSchema.index({ article: 1, createdAt: -1 });
commentSchema.index({ author: 1, createdAt: -1 });
commentSchema.index({ parentComment: 1, createdAt: 1 });
commentSchema.index({ article: 1, parentComment: 1 });

// Pre-save middleware to update edit timestamps
commentSchema.pre('save', function(next) {
  if (this.isModified('content') && !this.isNew) {
    this.isEdited = true;
    this.editedAt = new Date();
  }
  next();
});

// Post-save middleware to update article comment count
commentSchema.post('save', async function() {
  if (this.isNew && !this.parentComment) {
    // Only increment for top-level comments, not replies
    await mongoose.model('Article').findByIdAndUpdate(
      this.article,
      { $inc: { commentsCount: 1 } }
    );
  }
});

// Post-remove middleware to update article comment count
commentSchema.post('findOneAndDelete', async function(doc) {
  if (doc && !doc.parentComment) {
    // Only decrement for top-level comments
    await mongoose.model('Article').findByIdAndUpdate(
      doc.article,
      { $inc: { commentsCount: -1 } }
    );
  }
  
  // Remove all replies when parent comment is deleted
  if (doc && doc.replies.length > 0) {
    await mongoose.model('Comment').deleteMany({
      _id: { $in: doc.replies }
    });
  }
});

// Instance method to toggle like
commentSchema.methods.toggleLike = function(userId: string): { liked: boolean; likesCount: number } {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const likeIndex = this.likes.indexOf(userObjectId);
  
  if (likeIndex > -1) {
    // Unlike
    this.likes.splice(likeIndex, 1);
    return { liked: false, likesCount: this.likes.length };
  } else {
    // Like
    this.likes.push(userObjectId);
    return { liked: true, likesCount: this.likes.length };
  }
};

// Instance method to check edit permissions
commentSchema.methods.canBeEditedBy = function(userId: string, userRole: string): boolean {
  // Admin and Editor can edit any comment
  if (userRole === 'admin' || userRole === 'editor') {
    return true;
  }
  
  // Users can only edit their own comments within 24 hours
  if (this.author.toString() === userId) {
    const twentyFourHours = 24 * 60 * 60 * 1000;
    const now = new Date().getTime();
    const createdTime = new Date(this.createdAt).getTime();
    return (now - createdTime) <= twentyFourHours;
  }
  
  return false;
};

// Instance method to check delete permissions
commentSchema.methods.canBeDeletedBy = function(userId: string, userRole: string): boolean {
  // Admin can delete any comment
  if (userRole === 'admin') {
    return true;
  }
  
  // Editor can delete comments on any article
  if (userRole === 'editor') {
    return true;
  }
  
  // Users can delete their own comments
  if (this.author.toString() === userId) {
    return true;
  }
  
  return false;
};

// Instance method to add reply
commentSchema.methods.addReply = function(replyId: string): void {
  if (!this.replies.includes(replyId)) {
    this.replies.push(new mongoose.Types.ObjectId(replyId));
  }
};

// Instance method to remove reply
commentSchema.methods.removeReply = function(replyId: string): void {
  this.replies = this.replies.filter((id: string) => id.toString() !== replyId);
};

// Static method to get comments for an article with pagination
commentSchema.statics.getArticleComments = function(
  articleId: string,
  page = 1,
  limit = 20,
  sortBy = 'createdAt',
  sortOrder = 'desc'
) {
  const skip = (page - 1) * limit;
  const sort: any = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
  
  return this.find({
    article: articleId,
    parentComment: null // Only get top-level comments
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

// Static method to get comment statistics
commentSchema.statics.getStatistics = async function() {
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

// Static method to get most liked comments
commentSchema.statics.getMostLiked = function(limit = 10) {
  return this.find()
    .populate('author', 'username avatar')
    .populate('article', 'title')
    .sort({ likes: -1 })
    .limit(limit);
};

// Static method to get recent comments
commentSchema.statics.getRecent = function(limit = 10) {
  return this.find()
    .populate('author', 'username avatar')
    .populate('article', 'title')
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Virtual for like count
commentSchema.virtual('likesCount').get(function() {
  return this.likes.length;
});

// Virtual for reply count
commentSchema.virtual('repliesCount').get(function() {
  return this.replies.length;
});

// Virtual for comment depth (how deep in the reply chain)
commentSchema.virtual('depth').get(function() {
  return this.parentComment ? 1 : 0; // Simple depth: 0 for top-level, 1 for replies
});

// Virtual for comment URL
commentSchema.virtual('url').get(function() {
  return `/api/comments/${this._id}`;
});

const Comment = mongoose.model<IComment>('Comment', commentSchema);

export default Comment;