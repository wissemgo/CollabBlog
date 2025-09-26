/**
 * Socket.io Service for Real-time Features
 * Implements real-time comments and notifications as per requirements
 */

import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { 
  SocketComment, 
  SocketReply, 
  SocketTyping, 
  SocketNotification,
  Comment,
  User 
} from '../models';

import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket | null = null;
  private readonly serverUrl = environment.socketUrl;

  // Observables for real-time events
  private connectedSubject = new BehaviorSubject<boolean>(false);
  private commentAddedSubject = new BehaviorSubject<SocketComment | null>(null);
  private replyAddedSubject = new BehaviorSubject<SocketReply | null>(null);
  private userTypingSubject = new BehaviorSubject<SocketTyping | null>(null);
  private userStoppedTypingSubject = new BehaviorSubject<SocketTyping | null>(null);
  private notificationSubject = new BehaviorSubject<SocketNotification | null>(null);
  private articleLikeUpdateSubject = new BehaviorSubject<any>(null);
  private userStatusSubject = new BehaviorSubject<any>(null);

  // Public observables
  public connected$ = this.connectedSubject.asObservable();
  public commentAdded$ = this.commentAddedSubject.asObservable();
  public replyAdded$ = this.replyAddedSubject.asObservable();
  public userTyping$ = this.userTypingSubject.asObservable();
  public userStoppedTyping$ = this.userStoppedTypingSubject.asObservable();
  public notification$ = this.notificationSubject.asObservable();
  public articleLikeUpdate$ = this.articleLikeUpdateSubject.asObservable();
  public userStatus$ = this.userStatusSubject.asObservable();

  constructor(private authService: AuthService) {
    // Connect when user is authenticated
    this.authService.isAuthenticated$.subscribe(isAuth => {
      if (isAuth) {
        this.connect();
      } else {
        this.disconnect();
      }
    });
  }

  /**
   * Connect to Socket.io server
   */
  connect(): void {
    if (this.socket?.connected) {
      return;
    }

    const token = this.authService.getToken();
    if (!token) {
      console.warn('No auth token available for socket connection');
      return;
    }

    this.socket = io(this.serverUrl, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling']
    });

    this.setupEventListeners();
  }

  /**
   * Disconnect from Socket.io server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connectedSubject.next(false);
    }
  }

  /**
   * Setup socket event listeners
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('✅ Connected to Socket.io server');
      this.connectedSubject.next(true);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from Socket.io server:', reason);
      this.connectedSubject.next(false);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.connectedSubject.next(false);
    });

    // Comment events
    this.socket.on('comment_added', (data: SocketComment) => {
      console.log('💬 New comment received:', data);
      this.commentAddedSubject.next(data);
    });

    this.socket.on('reply_added', (data: SocketReply) => {
      console.log('↩️ New reply received:', data);
      this.replyAddedSubject.next(data);
    });

    // Typing events
    this.socket.on('user_typing', (data: SocketTyping) => {
      this.userTypingSubject.next(data);
    });

    this.socket.on('user_stopped_typing', (data: SocketTyping) => {
      this.userStoppedTypingSubject.next(data);
    });

    // Notification events
    this.socket.on('article_comment_notification', (data: SocketNotification) => {
      console.log('🔔 Article comment notification:', data);
      this.notificationSubject.next(data);
    });

    this.socket.on('comment_reply_notification', (data: SocketNotification) => {
      console.log('🔔 Comment reply notification:', data);
      this.notificationSubject.next(data);
    });

    this.socket.on('article_like_notification', (data: SocketNotification) => {
      console.log('❤️ Article like notification:', data);
      this.notificationSubject.next(data);
    });

    // Article events
    this.socket.on('article_like_update', (data: any) => {
      console.log('❤️ Article like update:', data);
      this.articleLikeUpdateSubject.next(data);
    });

    // User status events
    this.socket.on('user_status_updated', (data: any) => {
      this.userStatusSubject.next(data);
    });
  }

  /**
   * Join an article room for real-time updates
   */
  joinArticle(articleId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('join_article', articleId);
      console.log(`📝 Joined article room: ${articleId}`);
    }
  }

  /**
   * Leave an article room
   */
  leaveArticle(articleId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('leave_article', articleId);
      console.log(`📤 Left article room: ${articleId}`);
    }
  }

  /**
   * Emit new comment event
   */
  emitNewComment(data: {
    comment: Comment;
    author: User;
    articleId: string;
    articleAuthorId: string;
    articleTitle: string;
  }): void {
    if (this.socket?.connected) {
      this.socket.emit('new_comment', data);
      console.log('💬 Emitted new comment:', data);
    }
  }

  /**
   * Emit comment reply event
   */
  emitCommentReply(data: {
    reply: Comment;
    parentCommentId: string;
    author: User;
    articleId: string;
    articleTitle: string;
    originalCommentAuthorId: string;
  }): void {
    if (this.socket?.connected) {
      this.socket.emit('comment_reply', data);
      console.log('↩️ Emitted comment reply:', data);
    }
  }

  /**
   * Emit typing start event
   */
  emitTypingStart(articleId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('typing_start', { articleId });
    }
  }

  /**
   * Emit typing stop event
   */
  emitTypingStop(articleId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('typing_stop', { articleId });
    }
  }

  /**
   * Emit article liked event
   */
  emitArticleLiked(data: {
    articleId: string;
    likesCount: number;
    articleAuthorId: string;
    articleTitle: string;
  }): void {
    if (this.socket?.connected) {
      this.socket.emit('article_liked', data);
      console.log('❤️ Emitted article liked:', data);
    }
  }

  /**
   * Emit user status change
   */
  emitUserStatusChange(status: 'online' | 'away' | 'busy'): void {
    if (this.socket?.connected) {
      this.socket.emit('user_status_change', status);
    }
  }

  /**
   * Check if socket is connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Get socket instance (for advanced usage)
   */
  getSocket(): Socket | null {
    return this.socket;
  }

  /**
   * Manually reconnect socket
   */
  reconnect(): void {
    if (this.socket) {
      this.socket.connect();
    } else {
      this.connect();
    }
  }

  /**
   * Clear all subjects (for cleanup)
   */
  private clearSubjects(): void {
    this.commentAddedSubject.next(null);
    this.replyAddedSubject.next(null);
    this.userTypingSubject.next(null);
    this.userStoppedTypingSubject.next(null);
    this.notificationSubject.next(null);
    this.articleLikeUpdateSubject.next(null);
    this.userStatusSubject.next(null);
  }

  /**
   * Cleanup on service destroy
   */
  ngOnDestroy(): void {
    this.disconnect();
    this.clearSubjects();
  }
}