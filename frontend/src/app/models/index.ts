/**
 * Shared interfaces for the Angular frontend
 * These match the backend models and types
 */

export interface User {
  _id: string;
  username: string;
  email: string;
  role: UserRole;
  avatar?: string;
  bio?: string;
  isEmailVerified: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Article {
  _id: string;
  title: string;
  content: string;
  summary: string;
  author: User | string;
  tags: string[];
  category: string;
  featuredImage?: string;
  status: ArticleStatus;
  likes: string[];
  views: number;
  commentsCount: number;
  isPublished: boolean;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  likesCount?: number;
  readingTime?: number;
  excerpt?: string;
}

export interface Comment {
  _id: string;
  content: string;
  author: User | string;
  article: Article | string;
  parentComment?: Comment | string;
  replies: Comment[];
  likes: string[];
  isEdited: boolean;
  editedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  likesCount?: number;
  repliesCount?: number;
}

export interface Notification {
  _id: string;
  recipient: User | string;
  sender: User | string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  createdAt: Date;
}

// Enums
export enum UserRole {
  ADMIN = 'admin',
  EDITOR = 'editor',
  WRITER = 'writer',
  READER = 'reader'
}

export enum ArticleStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
  PENDING_REVIEW = 'pending_review'
}

export enum NotificationType {
  COMMENT = 'comment',
  REPLY = 'reply',
  LIKE = 'like',
  MENTION = 'mention',
  FOLLOW = 'follow',
  ARTICLE_PUBLISHED = 'article_published',
  SYSTEM = 'system'
}

// API Response interfaces
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface CreateArticleRequest {
  title: string;
  content: string;
  summary?: string;
  category: string;
  tags?: string[];
  featuredImage?: string;
  status?: ArticleStatus;
}

export interface UpdateArticleRequest extends Partial<CreateArticleRequest> {
  _id: string;
}

export interface CreateCommentRequest {
  content: string;
  article: string;
  parentComment?: string;
}

export interface UpdateProfileRequest {
  username?: string;
  bio?: string;
  avatar?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// Pagination interface
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export interface ArticleFilters extends PaginationParams {
  author?: string;
  category?: string;
  tags?: string[];
  status?: ArticleStatus;
  fromDate?: Date;
  toDate?: Date;
}

// Socket.io events
export interface SocketComment {
  comment: Comment;
  author: User;
  articleId: string;
  articleAuthorId: string;
  articleTitle: string;
}

export interface SocketReply {
  reply: Comment;
  parentCommentId: string;
  author: User;
  articleId: string;
  articleTitle: string;
  originalCommentAuthorId: string;
}

export interface SocketTyping {
  userId: string;
  username: string;
  articleId: string;
}

export interface SocketNotification {
  type: string;
  message: string;
  articleId?: string;
  articleTitle?: string;
  commentId?: string;
  timestamp: Date;
}