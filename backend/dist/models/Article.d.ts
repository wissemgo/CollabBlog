import mongoose, { Document } from 'mongoose';
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
    incrementViews(): void;
    toggleLike(userId: string): {
        liked: boolean;
        likesCount: number;
    };
    canBeEditedBy(userId: string, userRole: string): boolean;
    getReadingTime(): number;
}
declare const Article: mongoose.Model<IArticle, {}, {}, {}, mongoose.Document<unknown, {}, IArticle, {}, {}> & IArticle & Required<{
    _id: string;
}> & {
    __v: number;
}, any>;
export default Article;
//# sourceMappingURL=Article.d.ts.map