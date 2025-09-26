import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ChangeDetectorRef } from '@angular/core'; // Import ChangeDetectorRef
import { SocketService } from '../../services/socket.service';

import { Article, Comment, User } from '../../models';

import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-article-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="article-detail-container">
      <div class="loading-spinner" *ngIf="loading">
        <div class="spinner"></div>
        <p>Loading article...</p>
      </div>

      <div class="error-message" *ngIf="error">
        <h2>Error Loading Article</h2>
        <p>{{ error }}</p>
        <button (click)="goBack()" class="btn btn-primary">Go Back</button>
      </div>

      <article class="article-content" *ngIf="article && !loading && !error">
        <header class="article-header">
          <div class="breadcrumb">
            <a routerLink="/articles">Articles</a> 
            <span class="separator">></span> 
            <span>{{ article.title }}</span>
          </div>
          
          <h1 class="article-title">{{ article.title }}</h1>
          
          <div class="article-meta">
            <div class="author-info" *ngIf="articleAuthor">
              <img
                [src]="articleAuthor.avatar || '/assets/default-avatar.png'"
                [alt]="articleAuthor.username"
                class="author-avatar"
                (error)="onImageError($event)"
              >
              <div class="author-details">
                <span class="author-name">{{ articleAuthor.username }}</span>
                <span class="author-bio" *ngIf="articleAuthor.bio">{{ articleAuthor.bio }}</span>
              </div>
            </div>
            
            <div class="article-stats">
              <span class="publish-date" *ngIf="article.publishedAt">
                Published: {{ formatDate(article.publishedAt) }}
              </span>
              <span class="read-time" *ngIf="article.readingTime">
                {{ article.readingTime }} min read
              </span>
            </div>
          </div>

          <div class="article-tags" *ngIf="article.tags && article.tags.length > 0">
            <span class="tag" *ngFor="let tag of article.tags">#{{ tag }}</span>
          </div>

          <img 
            *ngIf="article.featuredImage" 
            [src]="article.featuredImage" 
            [alt]="article.title"
            class="featured-image"
            (error)="onImageError($event)"
          >
        </header>

        <div class="article-body">
          <div class="content" [innerHTML]="getFormattedContent()"></div>
        </div>

        <footer class="article-footer">
          <div class="article-actions">
            <button (click)="goBack()" class="btn btn-secondary">
              ← Back to Articles
            </button>
            <button (click)="shareArticle()" class="btn btn-primary">
              Share Article
            </button>
          </div>
        </footer>

        <section class="comments-section">
          <h3>Comments ({{ comments.length }})</h3>
          
          <div class="comment-form" *ngIf="isAuthenticated">
            <textarea 
              [(ngModel)]="newComment" 
              placeholder="Write a comment..."
              class="comment-input"
              rows="3"
              (input)="onCommentInput()"
              (keyup)="onCommentKeyUp()"
            ></textarea>
            
            <!-- Typing Indicators -->
            <div class="typing-indicators" *ngIf="typingUsers.length > 0">
              <span class="typing-text">
                {{ getTypingText() }}
              </span>
              <div class="typing-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
            
            <button 
              (click)="submitComment()" 
              [disabled]="!newComment.trim() || submittingComment"
              class="btn btn-primary"
            >
              {{ submittingComment ? 'Posting...' : 'Post Comment' }}
            </button>
          </div>

          <div class="login-prompt" *ngIf="!isAuthenticated">
            <p>Please <a routerLink="/auth/login">login</a> to post comments.</p>
          </div>

          <div class="comments-list">
            <div class="comment" *ngFor="let comment of comments">
              <div class="comment-header">
                <img
                  [src]="getCommentAuthor(comment)?.avatar || '/assets/default-avatar.png'"
                  [alt]="getCommentAuthor(comment)?.username"
                  class="comment-avatar"
                  (error)="onImageError($event)"
                >
                <div class="comment-meta">
                  <span class="comment-author">{{ getCommentAuthor(comment)?.username }}</span>
                  <span class="comment-date">{{ formatDate(comment.createdAt) }}</span>
                </div>
              </div>
              <div class="comment-content">{{ comment.content }}</div>
            </div>
          </div>
        </section>
      </article>
    </div>
  `,
  styles: [`
    .article-detail-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    .loading-spinner {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      text-align: center;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #007bff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 20px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .error-message {
      text-align: center;
      padding: 40px 20px;
      background: #f8d7da;
      border: 1px solid #f5c6cb;
      border-radius: 8px;
      color: #721c24;
      margin: 20px 0;
    }

    .breadcrumb {
      margin-bottom: 20px;
      font-size: 14px;
      color: #666;
    }

    .breadcrumb a {
      color: #007bff;
      text-decoration: none;
    }

    .breadcrumb a:hover {
      text-decoration: underline;
    }

    .separator {
      margin: 0 8px;
    }

    .article-title {
      font-size: 2.5rem;
      font-weight: 700;
      margin-bottom: 20px;
      line-height: 1.2;
      color: #2c3e50;
    }

    .article-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 20px;
      border-bottom: 1px solid #eee;
    }

    .author-info {
      display: flex;
      align-items: center;
    }

    .author-avatar {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      margin-right: 15px;
      object-fit: cover;
      border: 2px solid #e9ecef;
    }

    .author-details {
      display: flex;
      flex-direction: column;
    }

    .author-name {
      font-weight: 600;
      color: #2c3e50;
      margin-bottom: 4px;
    }

    .author-bio {
      font-size: 0.9rem;
      color: #666;
    }

    .article-stats {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      font-size: 0.9rem;
      color: #666;
    }

    .publish-date {
      margin-bottom: 4px;
    }

    .article-tags {
      margin-bottom: 20px;
    }

    .tag {
      display: inline-block;
      background: #e3f2fd;
      color: #1976d2;
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 0.85rem;
      margin-right: 8px;
      margin-bottom: 8px;
    }

    .featured-image {
      width: 100%;
      max-height: 400px;
      object-fit: cover;
      border-radius: 8px;
      margin-bottom: 30px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .article-body {
      margin-bottom: 40px;
    }

    .content {
      line-height: 1.8;
      font-size: 1.1rem;
      color: #333;
    }

    .content p {
      margin-bottom: 20px;
    }

    .content h1, .content h2, .content h3 {
      margin-top: 30px;
      margin-bottom: 15px;
      color: #2c3e50;
    }

    .content h1 {
      font-size: 2rem;
    }

    .content h2 {
      font-size: 1.6rem;
    }

    .content h3 {
      font-size: 1.3rem;
    }

    .content blockquote {
      border-left: 4px solid #007bff;
      padding-left: 20px;
      margin: 20px 0;
      font-style: italic;
      color: #666;
    }

    .content code {
      background: #f8f9fa;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 0.9rem;
    }

    .content pre {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      overflow-x: auto;
      margin: 20px 0;
    }

    .article-footer {
      border-top: 1px solid #eee;
      padding-top: 20px;
      margin-bottom: 40px;
    }

    .article-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.95rem;
      font-weight: 500;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      transition: all 0.3s ease;
    }

    .btn-primary {
      background: #007bff;
      color: white;
    }

    .btn-primary:hover {
      background: #0056b3;
    }

    .btn-secondary {
      background: #6c757d;
      color: white;
    }

    .btn-secondary:hover {
      background: #545b62;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .comments-section {
      border-top: 2px solid #eee;
      padding-top: 30px;
    }

    .comments-section h3 {
      margin-bottom: 20px;
      color: #2c3e50;
    }

    .comment-form {
      margin-bottom: 30px;
    }

    .comment-input {
      width: 100%;
      padding: 12px;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 1rem;
      resize: vertical;
      margin-bottom: 10px;
    }

    .comment-input:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
    }

    .login-prompt {
      text-align: center;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 6px;
      margin-bottom: 30px;
    }

    .login-prompt a {
      color: #007bff;
      text-decoration: none;
    }

    .login-prompt a:hover {
      text-decoration: underline;
    }

    .comments-list {
      space-y: 20px;
    }

    .comment {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 15px;
    }

    .comment-header {
      display: flex;
      align-items: center;
    }

    .comment-avatar {
      width: 35px;
      height: 35px;
      border-radius: 50%;
      margin-right: 10px;
      object-fit: cover;
    }

    .comment-meta {
      display: flex;
      flex-direction: column;
    }

    .comment-author {
      font-weight: 600;
      color: #2c3e50;
      font-size: 0.9rem;
    }

    .comment-date {
      font-size: 0.8rem;
      color: #666;
    }

    .comment-content {
      line-height: 1.6;
      color: #333;
    }

    .typing-indicators {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 8px 0;
      font-size: 0.9rem;
      color: #666;
    }

    .typing-text {
      font-style: italic;
    }

    .typing-dots {
      display: flex;
      gap: 2px;
    }

    .typing-dots span {
      width: 4px;
      height: 4px;
      background: #666;
      border-radius: 50%;
      animation: typing 1.4s infinite;
    }
 
    .typing-dots span:nth-child(2) {
      animation-delay: 0.2s;
    }
 
    .typing-dots span:nth-child(3) {
      animation-delay: 0.4s;
    }
 
    @keyframes typing {
      0%, 60%, 100% {
        transform: translateY(0);
        opacity: 0.4;
      }
      30% {
        transform: translateY(-10px);
        opacity: 1;
      }
    }
 
    @media (max-width: 768px) {
      .article-detail-container {
        padding: 15px;
      }
 
      .article-title {
        font-size: 2rem;
      }
 
      .article-meta {
        flex-direction: column;
        align-items: flex-start;
      }
 
      .article-stats {
        align-items: flex-start;
        margin-top: 10px;
      }
 
      .article-actions {
        flex-direction: column;
        gap: 10px;
      }
 
      .btn {
        width: 100%;
        justify-content: center;
      }
    }
  `]
})
export class ArticleDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  private socketService = inject(SocketService);
  private sanitizer = inject(DomSanitizer);
  private cdr = inject(ChangeDetectorRef); // Inject ChangeDetectorRef
 
  article: Article | null = null;
  comments: Comment[] = [];
  loading = true;
  error: string | null = null;
  newComment = '';
  submittingComment = false;
  isAuthenticated = false;
  currentUserId: string | null = null;
  isTyping = false;
  typingUsers: string[] = [];
  typingTimeout: any;
 
  ngOnInit() {
    // Check authentication status
    this.checkAuthStatus();
    
    // Get article ID from route
    const articleId = this.route.snapshot.paramMap.get('id');
    if (articleId) {
      this.loadArticle(articleId);
      this.loadComments(articleId);
      this.setupSocketListeners(articleId);
    } else {
      this.error = 'No article ID provided';
      this.loading = false;
    }
  }
 
  private checkAuthStatus() {
    const token = localStorage.getItem('accessToken');
    this.isAuthenticated = !!token;
    
    if (token) {
      // Get current user ID from token payload
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        this.currentUserId = payload.userId || payload._id;
      } catch (error) {
        console.error('Error parsing token:', error);
      }
    }
  }
 
  private setupSocketListeners(articleId: string) {
    if (!this.socketService) return;
 
    // Join article room for real-time updates
    this.socketService.joinArticle(articleId);
 
    // Listen for new comments (simplified for now)
    this.socketService.commentAdded$.subscribe(socketComment => {
      if (socketComment && socketComment.articleId === articleId) {
        // Reload comments to get fresh data
        this.loadComments(articleId);
      }
    });
 
    // Listen for typing indicators  
    this.socketService.userTyping$.subscribe(typing => {
      if (typing && typing.articleId === articleId && typing.username !== this.getCurrentUsername()) {
        if (!this.typingUsers.includes(typing.username)) {
          this.typingUsers.push(typing.username);
        }
      }
    });
 
    this.socketService.userStoppedTyping$.subscribe(typing => {
      if (typing && typing.articleId === articleId) {
        this.typingUsers = this.typingUsers.filter(user => user !== typing.username);
      }
    });
  }
 
  private getCurrentUsername(): string {
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.username || 'Unknown';
      } catch (error) {
        return 'Unknown';
      }
    }
    return 'Unknown';
  }
 
  private loadArticle(id: string) {
    this.loading = true;
    this.error = null;

    this.http.get<any>(`${environment.apiUrl}/articles/${id}`)
      .subscribe({
        next: (response) => {
          console.log('Article API response:', response); // Debug log
          if (response.success && response.data && response.data.article) {
            this.article = response.data.article;
            console.log('Loaded article:', this.article); // Debug log
          } else {
            this.error = 'Article not found or invalid response';
          }
          this.loading = false;
          this.cdr.detectChanges(); // Manually trigger change detection
        },
        error: (error) => {
          console.error('Error loading article:', error);
          this.error = error.error?.message || 'Failed to load article';
          this.loading = false;
        }
      });
  }
 
  private loadComments(articleId: string) {
    this.http.get<any>(`${environment.apiUrl}/comments?article=${articleId}`)
      .subscribe({
        next: (response) => {
          if (response.success && response.data && Array.isArray(response.data.comments)) {
            this.comments = response.data.comments;
          } else {
            this.comments = [];
          }
        },
        error: (error) => {
          console.error('Error loading comments:', error);
          // Don't show error for comments, just log it
        }
      });
  }
 
  submitComment() {
    if (!this.newComment.trim() || !this.article || this.submittingComment) {
      return;
    }
 
    this.submittingComment = true;
    const token = localStorage.getItem('accessToken');
 
    this.http.post<Comment>(`${environment.apiUrl}/articles/${this.article._id}/comments`, 
      { content: this.newComment.trim() },
      { headers: { Authorization: `Bearer ${token}` } }
    ).subscribe({
      next: (comment) => {
        this.comments.unshift(comment);
        
        // Emit socket event for real-time updates
        if (this.socketService && this.article) {
          const currentUser = this.getCurrentUser();
          this.socketService.emitNewComment({
            comment: comment as any,
            author: currentUser,
            articleId: this.article._id,
            articleAuthorId: typeof this.article.author === 'string' ? this.article.author : this.article.author._id,
            articleTitle: this.article.title
          });
        }
        
        this.newComment = '';
        this.submittingComment = false;
        this.stopTyping();
      },
      error: (error) => {
        console.error('Error posting comment:', error);
        this.submittingComment = false;
        alert('Failed to post comment. Please try again.');
      }
    });
  }
 
  onCommentInput() {
    if (this.article && this.socketService) {
      this.startTyping();
    }
  }
 
  onCommentKeyUp() {
    // Reset typing timeout
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
    
    this.typingTimeout = setTimeout(() => {
      this.stopTyping();
    }, 2000); // Stop typing after 2 seconds of inactivity
  }
 
  private startTyping() {
    if (!this.isTyping && this.article) {
      this.isTyping = true;
      this.socketService.emitTypingStart(this.article._id);
    }
  }
 
  private stopTyping() {
    if (this.isTyping && this.article) {
      this.isTyping = false;
      this.socketService.emitTypingStop(this.article._id);
    }
  }
 
  getTypingText(): string {
    if (this.typingUsers.length === 0) return '';
    if (this.typingUsers.length === 1) return `${this.typingUsers[0]} is typing...`;
    if (this.typingUsers.length === 2) return `${this.typingUsers[0]} and ${this.typingUsers[1]} are typing...`;
    return `${this.typingUsers[0]} and ${this.typingUsers.length - 1} others are typing...`;
  }
 
  private getCurrentUser(): any {
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return {
          _id: payload.userId || payload._id || '',
          username: payload.username || 'Unknown',
          avatar: payload.avatar || ''
        };
      } catch (error) {
        return { _id: '', username: 'Unknown', avatar: '' };
      }
    }
    return { _id: '', username: 'Unknown', avatar: '' };
  }
 
  formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
 
  getFormattedContent(): SafeHtml { // Change return type to SafeHtml
    if (!this.article?.content) return this.sanitizer.bypassSecurityTrustHtml('');
    
    // Sanitize the content to prevent XSS attacks
    return this.sanitizer.bypassSecurityTrustHtml(this.article.content);
  }
 
  onImageError(event: any) {
    // Fallback image in case the author's avatar is missing or fails to load
    event.target.src = '/assets/default-avatar.png';
  }
 
  goBack() {
    this.router.navigate(['/articles']);
  }
 
  shareArticle() {
    if (navigator.share && this.article) {
      navigator.share({
        title: this.article.title,
        text: this.article.summary || this.article.title, // Use article.summary instead of excerpt
        url: window.location.href
      }).catch(err => console.log('Error sharing:', err));
    } else {
      // Fallback: copy URL to clipboard
      navigator.clipboard.writeText(window.location.href).then(() => {
        alert('Article URL copied to clipboard!');
      }).catch(() => {
        alert('Unable to copy URL. Please copy manually from the address bar.');
      });
    }
  }
 
  get articleAuthor(): { _id: string; username: string; avatar?: string; bio?: string; } | null {
    if (this.article && typeof this.article.author === 'object') {
      return this.article.author;
    }
    return null;
  }
 
  getCommentAuthor(comment: Comment): { _id: string; username: string; avatar?: string; } | null {
    if (comment && typeof comment.author === 'object') {
      return comment.author;
    }
    return null;
  }
}