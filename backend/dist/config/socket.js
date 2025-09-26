"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.broadcastNotification = exports.emitToArticle = exports.emitToUser = exports.setupSocketIO = void 0;
const setupSocketIO = (io) => {
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
            if (!token) {
                return next(new Error('Authentication token required'));
            }
            socket.user = { _id: 'temp-user-id', username: 'temp-user', email: 'temp@example.com', role: 'reader' };
            next();
        }
        catch (error) {
            next(new Error('Invalid authentication token'));
        }
    });
    io.on('connection', (socket) => {
        console.log(`✅ User ${socket.user?.username} connected: ${socket.id}`);
        if (socket.user) {
            socket.join(`user:${socket.user._id}`);
        }
        socket.on('join_article', (articleId) => {
            socket.join(`article:${articleId}`);
            console.log(`📝 User ${socket.user?.username} joined article room: ${articleId}`);
        });
        socket.on('leave_article', (articleId) => {
            socket.leave(`article:${articleId}`);
            console.log(`📤 User ${socket.user?.username} left article room: ${articleId}`);
        });
        socket.on('new_comment', (data) => {
            socket.to(`article:${data.articleId}`).emit('comment_added', {
                comment: data.comment,
                author: data.author,
                timestamp: new Date(),
                articleId: data.articleId
            });
            if (data.articleAuthorId && data.articleAuthorId !== socket.user?._id) {
                io.to(`user:${data.articleAuthorId}`).emit('article_comment_notification', {
                    type: 'new_comment',
                    message: `${socket.user?.username} commented on your article`,
                    articleId: data.articleId,
                    articleTitle: data.articleTitle,
                    commentId: data.comment._id,
                    timestamp: new Date()
                });
            }
        });
        socket.on('comment_reply', (data) => {
            socket.to(`article:${data.articleId}`).emit('reply_added', {
                reply: data.reply,
                parentCommentId: data.parentCommentId,
                author: data.author,
                timestamp: new Date(),
                articleId: data.articleId
            });
            if (data.originalCommentAuthorId && data.originalCommentAuthorId !== socket.user?._id) {
                io.to(`user:${data.originalCommentAuthorId}`).emit('comment_reply_notification', {
                    type: 'comment_reply',
                    message: `${socket.user?.username} replied to your comment`,
                    articleId: data.articleId,
                    articleTitle: data.articleTitle,
                    commentId: data.parentCommentId,
                    replyId: data.reply._id,
                    timestamp: new Date()
                });
            }
        });
        socket.on('typing_start', (data) => {
            socket.to(`article:${data.articleId}`).emit('user_typing', {
                userId: socket.user?._id,
                username: socket.user?.username,
                articleId: data.articleId
            });
        });
        socket.on('typing_stop', (data) => {
            socket.to(`article:${data.articleId}`).emit('user_stopped_typing', {
                userId: socket.user?._id,
                articleId: data.articleId
            });
        });
        socket.on('article_liked', (data) => {
            socket.to(`article:${data.articleId}`).emit('article_like_update', {
                articleId: data.articleId,
                likesCount: data.likesCount,
                likedBy: socket.user?._id
            });
            if (data.articleAuthorId && data.articleAuthorId !== socket.user?._id) {
                io.to(`user:${data.articleAuthorId}`).emit('article_like_notification', {
                    type: 'article_liked',
                    message: `${socket.user?.username} liked your article`,
                    articleId: data.articleId,
                    articleTitle: data.articleTitle,
                    timestamp: new Date()
                });
            }
        });
        socket.on('user_status_change', (status) => {
            socket.broadcast.emit('user_status_updated', {
                userId: socket.user?._id,
                username: socket.user?.username,
                status: status,
                timestamp: new Date()
            });
        });
        socket.on('disconnect', (reason) => {
            console.log(`❌ User ${socket.user?.username} disconnected: ${reason}`);
            socket.broadcast.emit('user_status_updated', {
                userId: socket.user?._id,
                username: socket.user?.username,
                status: 'offline',
                timestamp: new Date()
            });
        });
        socket.on('error', (error) => {
            console.error('Socket error:', error);
        });
    });
    console.log('🔌 Socket.IO server configured');
};
exports.setupSocketIO = setupSocketIO;
const emitToUser = (io, userId, event, data) => {
    io.to(`user:${userId}`).emit(event, data);
};
exports.emitToUser = emitToUser;
const emitToArticle = (io, articleId, event, data) => {
    io.to(`article:${articleId}`).emit(event, data);
};
exports.emitToArticle = emitToArticle;
const broadcastNotification = (io, event, data) => {
    io.emit(event, data);
};
exports.broadcastNotification = broadcastNotification;
//# sourceMappingURL=socket.js.map