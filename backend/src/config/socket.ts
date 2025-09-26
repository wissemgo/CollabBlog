/**
 * Socket.IO configuration for real-time features
 */

import { Server as SocketIOServer, Socket } from 'socket.io';
// Note: auth middleware and User model will be created in subsequent steps

interface AuthenticatedSocket extends Socket {
  user?: {
    _id: string;
    username: string;
    email: string;
    role: string;
  };
}

export const setupSocketIO = (io: SocketIOServer): void => {
  // Middleware for socket authentication
  io.use(async (socket: any, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      // TODO: Implement JWT verification when auth middleware is ready
      // For now, allow all connections with token
      socket.user = { _id: 'temp-user-id', username: 'temp-user', email: 'temp@example.com', role: 'reader' };
      next();
    } catch (error) {
      next(new Error('Invalid authentication token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`✅ User ${socket.user?.username} connected: ${socket.id}`);

    // Join user to their personal room for notifications
    if (socket.user) {
      socket.join(`user:${socket.user._id}`);
    }

    // Join article rooms for real-time comments
    socket.on('join_article', (articleId: string) => {
      socket.join(`article:${articleId}`);
      console.log(`📝 User ${socket.user?.username} joined article room: ${articleId}`);
    });

    // Leave article rooms
    socket.on('leave_article', (articleId: string) => {
      socket.leave(`article:${articleId}`);
      console.log(`📤 User ${socket.user?.username} left article room: ${articleId}`);
    });

    // Handle new comments
    socket.on('new_comment', (data) => {
      // Broadcast to all users in the article room
      socket.to(`article:${data.articleId}`).emit('comment_added', {
        comment: data.comment,
        author: data.author,
        timestamp: new Date(),
        articleId: data.articleId
      });

      // Notify article author if they're online
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

    // Handle comment replies
    socket.on('comment_reply', (data) => {
      // Broadcast to article room
      socket.to(`article:${data.articleId}`).emit('reply_added', {
        reply: data.reply,
        parentCommentId: data.parentCommentId,
        author: data.author,
        timestamp: new Date(),
        articleId: data.articleId
      });

      // Notify original comment author
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

    // Handle typing indicators
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

    // Handle article likes/dislikes
    socket.on('article_liked', (data) => {
      socket.to(`article:${data.articleId}`).emit('article_like_update', {
        articleId: data.articleId,
        likesCount: data.likesCount,
        likedBy: socket.user?._id
      });

      // Notify article author
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

    // Handle user status updates
    socket.on('user_status_change', (status: 'online' | 'away' | 'busy') => {
      socket.broadcast.emit('user_status_updated', {
        userId: socket.user?._id,
        username: socket.user?.username,
        status: status,
        timestamp: new Date()
      });
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      console.log(`❌ User ${socket.user?.username} disconnected: ${reason}`);
      
      // Broadcast user offline status
      socket.broadcast.emit('user_status_updated', {
        userId: socket.user?._id,
        username: socket.user?.username,
        status: 'offline',
        timestamp: new Date()
      });
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  console.log('🔌 Socket.IO server configured');
};

// Helper function to emit notifications to specific users
export const emitToUser = (io: SocketIOServer, userId: string, event: string, data: any): void => {
  io.to(`user:${userId}`).emit(event, data);
};

// Helper function to emit to article rooms
export const emitToArticle = (io: SocketIOServer, articleId: string, event: string, data: any): void => {
  io.to(`article:${articleId}`).emit(event, data);
};

// Helper function to broadcast system-wide notifications
export const broadcastNotification = (io: SocketIOServer, event: string, data: any): void => {
  io.emit(event, data);
};