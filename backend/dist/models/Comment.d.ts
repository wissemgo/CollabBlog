import mongoose, { Document } from 'mongoose';
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
    toggleLike(userId: string): {
        liked: boolean;
        likesCount: number;
    };
    canBeEditedBy(userId: string, userRole: string): boolean;
    canBeDeletedBy(userId: string, userRole: string): boolean;
    addReply(replyId: string): void;
    removeReply(replyId: string): void;
}
declare const Comment: mongoose.Model<IComment, {}, {}, {}, mongoose.Document<unknown, {}, IComment, {}, {}> & IComment & Required<{
    _id: string;
}> & {
    __v: number;
}, any>;
export default Comment;
//# sourceMappingURL=Comment.d.ts.map