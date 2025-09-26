/**
 * Article Model - MongoDB Schema for blog articles
 */

import mongoose, { Schema, Document } from 'mongoose';
import { ArticleStatus } from '../types';

export interface IArticle extends Document {
  _id: string;
  title: string;
  content: string;
  summary: string;
  author: mongoose.Types.ObjectId;
  tags: string[];
  category: string;
  featuredImage?: string;
  status: ArticleStatus;
  likes: mongoose.Types.ObjectId[];
  views: number;
  commentsCount: number;
  isPublished: boolean;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  incrementViews(): void;
  toggleLike(userId: string): { liked: boolean; likesCount: number };
  canBeEditedBy(userId: string, userRole: string): boolean;
  getReadingTime(): number;
}

/**
 * @swagger
 * components:
 *   schemas:
 *     Article:
 *       type: object
 *       required:
 *         - title
 *         - content
 *         - author
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique identifier for the article
 *         title:
 *           type: string
 *           description: Article title
 *           minLength: 5
 *           maxLength: 200
 *         content:
 *           type: string
 *           description: Article content in HTML format
 *           minLength: 100
 *         summary:
 *           type: string
 *           description: Article summary/excerpt
 *           maxLength: 500
 *         author:
 *           type: string
 *           description: ID of the article author
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of tags associated with the article
 *         category:
 *           type: string
 *           description: Article category
 *         featuredImage:
 *           type: string
 *           description: URL to the featured image
 *         status:
 *           type: string
 *           enum: [draft, published, archived, pending_review]
 *           description: Article publication status
 *         likes:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of user IDs who liked the article
 *         views:
 *           type: number
 *           description: Number of views
 *         commentsCount:
 *           type: number
 *           description: Number of comments
 *         isPublished:
 *           type: boolean
 *           description: Whether the article is published
 *         publishedAt:
 *           type: string
 *           format: date-time
 *           description: Publication timestamp
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 */

const articleSchema = new Schema<IArticle>(
  {
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
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Article author is required'],
      index: true
    },
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: function(tags: string[]) {
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
        validator: function(url: string) {
          if (!url) return true;
          return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(url);
        },
        message: 'Featured image must be a valid image URL'
      }
    },
    status: {
      type: String,
      enum: Object.values(ArticleStatus),
      default: ArticleStatus.DRAFT,
      required: true,
      index: true
    },
    likes: {
      type: [Schema.Types.ObjectId],
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
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Compound indexes for better query performance
articleSchema.index({ author: 1, status: 1 });
articleSchema.index({ status: 1, publishedAt: -1 });
articleSchema.index({ category: 1, status: 1 });
articleSchema.index({ tags: 1, status: 1 });
articleSchema.index({ title: 'text', content: 'text', summary: 'text' });
articleSchema.index({ createdAt: -1 });
articleSchema.index({ views: -1 });
articleSchema.index({ likes: -1 });

// Pre-save middleware
articleSchema.pre('save', function(next) {
  // Set publishedAt when article is published for the first time
  if (this.isModified('status') && this.status === ArticleStatus.PUBLISHED && !this.publishedAt) {
    this.publishedAt = new Date();
    this.isPublished = true;
  }
  
  // Generate summary from content if not provided
  if (!this.summary && this.content) {
    const plainText = this.content.replace(/<[^>]*>/g, '');
    this.summary = plainText.substring(0, 200) + (plainText.length > 200 ? '...' : '');
  }
  
  next();
});

// Instance method to increment views
articleSchema.methods.incrementViews = function(): void {
  this.views += 1;
  this.save();
};

// Instance method to toggle like
articleSchema.methods.toggleLike = function(userId: string): { liked: boolean; likesCount: number } {
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
articleSchema.methods.canBeEditedBy = function(userId: string, userRole: string): boolean {
  // Admin and Editor can edit any article
  if (userRole === 'admin' || userRole === 'editor') {
    return true;
  }
  
  // Writer can only edit their own articles
  if (userRole === 'writer') {
    return this.author.toString() === userId;
  }
  
  // Readers cannot edit articles
  return false;
};

// Instance method to calculate reading time
articleSchema.methods.getReadingTime = function(): number {
  const wordsPerMinute = 200;
  const plainText = this.content.replace(/<[^>]*>/g, '');
  const wordCount = plainText.trim().split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
};

// Static method to get popular articles
articleSchema.statics.getPopular = function(limit = 10) {
  return this.find({ status: ArticleStatus.PUBLISHED })
    .sort({ views: -1, likes: -1 })
    .limit(limit)
    .populate('author', 'username avatar')
    .select('title summary featuredImage views likes createdAt author');
};

// Static method to get recent articles
articleSchema.statics.getRecent = function(limit = 10) {
  return this.find({ status: ArticleStatus.PUBLISHED })
    .sort({ publishedAt: -1 })
    .limit(limit)
    .populate('author', 'username avatar')
    .select('title summary featuredImage views likes publishedAt author');
};

// Static method to search articles
articleSchema.statics.search = function(query: string, filters: any = {}) {
  const searchQuery: any = {
    $and: [
      { status: ArticleStatus.PUBLISHED },
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
  
  // Add additional filters
  if (filters.category) {
    (searchQuery.$and as any[]).push({ category: filters.category });
  }
  
  if (filters.author) {
    (searchQuery.$and as any[]).push({ author: filters.author });
  }
  
  if (filters.tags && filters.tags.length > 0) {
    (searchQuery.$and as any[]).push({ tags: { $in: filters.tags } });
  }
  
  return this.find(searchQuery)
    .populate('author', 'username avatar')
    .sort({ score: { $meta: 'textScore' }, publishedAt: -1 });
};

// Static method to get article statistics
articleSchema.statics.getStatistics = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalArticles: { $sum: 1 },
        publishedArticles: {
          $sum: { $cond: [{ $eq: ['$status', ArticleStatus.PUBLISHED] }, 1, 0] }
        },
        draftArticles: {
          $sum: { $cond: [{ $eq: ['$status', ArticleStatus.DRAFT] }, 1, 0] }
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

// Virtual for like count
articleSchema.virtual('likesCount').get(function() {
  return this.likes.length;
});

// Virtual for reading time
articleSchema.virtual('readingTime').get(function() {
  return this.getReadingTime();
});

// Virtual for article URL
articleSchema.virtual('url').get(function() {
  return `/api/articles/${this._id}`;
});

// Virtual for comment relationship
articleSchema.virtual('comments', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'article'
});

const Article = mongoose.model<IArticle>('Article', articleSchema);

export default Article;