export interface IUser {
    _id: string;
    username: string;
    email: string;
    password: string;
    role: UserRole;
    avatar?: string;
    bio?: string;
    isEmailVerified: boolean;
    refreshTokens: string[];
    lastLogin?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface IArticle {
    _id: string;
    title: string;
    content: string;
    summary: string;
    author: string | IUser;
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
}
export interface IComment {
    _id: string;
    content: string;
    author: string | IUser;
    article: string | IArticle;
    parentComment?: string | IComment;
    replies: string[] | IComment[];
    likes: string[];
    isEdited: boolean;
    editedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface INotification {
    _id: string;
    recipient: string | IUser;
    sender: string | IUser;
    type: NotificationType;
    title: string;
    message: string;
    data?: any;
    isRead: boolean;
    createdAt: Date;
}
export interface IAnalytics {
    _id: string;
    article: string | IArticle;
    views: IViewAnalytics[];
    likes: ILikeAnalytics[];
    comments: ICommentAnalytics[];
    shares: IShareAnalytics[];
    createdAt: Date;
    updatedAt: Date;
}
export interface IViewAnalytics {
    userId?: string;
    ipAddress: string;
    userAgent: string;
    referrer?: string;
    timestamp: Date;
}
export interface ILikeAnalytics {
    userId: string;
    timestamp: Date;
}
export interface ICommentAnalytics {
    commentId: string;
    userId: string;
    timestamp: Date;
}
export interface IShareAnalytics {
    userId?: string;
    platform: SharePlatform;
    timestamp: Date;
}
export declare enum UserRole {
    ADMIN = "admin",
    EDITOR = "editor",
    WRITER = "writer",
    READER = "reader"
}
export declare enum ArticleStatus {
    DRAFT = "draft",
    PUBLISHED = "published",
    ARCHIVED = "archived",
    PENDING_REVIEW = "pending_review"
}
export declare enum NotificationType {
    COMMENT = "comment",
    REPLY = "reply",
    LIKE = "like",
    MENTION = "mention",
    FOLLOW = "follow",
    ARTICLE_PUBLISHED = "article_published",
    SYSTEM = "system"
}
export declare enum SharePlatform {
    TWITTER = "twitter",
    FACEBOOK = "facebook",
    LINKEDIN = "linkedin",
    REDDIT = "reddit",
    EMAIL = "email",
    COPY_LINK = "copy_link"
}
export interface AuthRequest {
    email: string;
    password: string;
}
export interface RegisterRequest {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
}
export interface AuthResponse {
    user: Omit<IUser, 'password' | 'refreshTokens'>;
    token: string;
    refreshToken: string;
}
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
export interface PaginationQuery {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    search?: string;
}
export interface ArticleQuery extends PaginationQuery {
    author?: string;
    category?: string;
    tags?: string[];
    status?: ArticleStatus;
    fromDate?: Date;
    toDate?: Date;
}
export interface CommentQuery extends PaginationQuery {
    article?: string;
    author?: string;
    parentComment?: string;
}
export interface SocketEvents {
    join_article: (articleId: string) => void;
    leave_article: (articleId: string) => void;
    article_liked: (data: {
        articleId: string;
        likesCount: number;
        articleAuthorId: string;
        articleTitle: string;
    }) => void;
    new_comment: (data: {
        comment: IComment;
        author: IUser;
        articleId: string;
        articleAuthorId: string;
        articleTitle: string;
    }) => void;
    comment_reply: (data: {
        reply: IComment;
        parentCommentId: string;
        author: IUser;
        articleId: string;
        articleTitle: string;
        originalCommentAuthorId: string;
    }) => void;
    typing_start: (data: {
        articleId: string;
    }) => void;
    typing_stop: (data: {
        articleId: string;
    }) => void;
    user_status_change: (status: 'online' | 'away' | 'busy') => void;
}
export interface ApiError extends Error {
    statusCode: number;
    isOperational: boolean;
}
export interface ValidationSchema {
    [key: string]: {
        required?: boolean;
        type?: 'string' | 'number' | 'boolean' | 'email' | 'password' | 'array' | 'object';
        minLength?: number;
        maxLength?: number;
        min?: number;
        max?: number;
        pattern?: RegExp;
        enum?: string[];
        custom?: (value: any) => boolean | string;
    };
}
export interface FileUpload {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    destination: string;
    filename: string;
    path: string;
    buffer: Buffer;
}
export interface JWTPayload {
    userId: string;
    email: string;
    role: UserRole;
    iat: number;
    exp: number;
}
export interface DatabaseConfig {
    uri: string;
    options: {
        maxPoolSize?: number;
        serverSelectionTimeoutMS?: number;
        socketTimeoutMS?: number;
        bufferMaxEntries?: number;
        useNewUrlParser?: boolean;
        useUnifiedTopology?: boolean;
    };
}
//# sourceMappingURL=index.d.ts.map