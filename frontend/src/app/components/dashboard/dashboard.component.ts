import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { ArticleService } from '../../services/article.service';
import { User, Article, UserRole } from '../../models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="dashboard-container">
      <!-- Header -->
      <div class="dashboard-header">
        <div class="welcome-section">
          <h1>Welcome back, {{ currentUser?.username }}!</h1>
          <p class="role-badge" [class]="getRoleClass()">
            <i [class]="getRoleIcon()"></i>
            {{ getRoleDisplayName() }}
          </p>
        </div>
        <div class="quick-actions">
          <button 
            *ngIf="canCreateArticles()"
            routerLink="/articles/create"
            class="btn btn-primary"
          >
            <i class="fas fa-plus"></i>
            New Article
          </button>
          <button routerLink="/profile" class="btn btn-secondary">
            <i class="fas fa-user"></i>
            Profile
          </button>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-newspaper"></i>
          </div>
          <div class="stat-content">
            <h3>{{ userStats.totalArticles }}</h3>
            <p>Articles Written</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-eye"></i>
          </div>
          <div class="stat-content">
            <h3>{{ userStats.totalViews }}</h3>
            <p>Total Views</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-comment"></i>
          </div>
          <div class="stat-content">
            <h3>{{ userStats.totalComments }}</h3>
            <p>Comments Received</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-heart"></i>
          </div>
          <div class="stat-content">
            <h3>{{ userStats.totalLikes }}</h3>
            <p>Likes Received</p>
          </div>
        </div>
      </div>

      <!-- Main Content Grid -->
      <div class="content-grid">
        <!-- Recent Articles -->
        <div class="content-section">
          <div class="section-header">
            <h2>Your Recent Articles</h2>
            <a routerLink="/articles/my-articles" class="view-all-link">View All</a>
          </div>
          
          <div class="articles-list" *ngIf="recentArticles.length > 0; else noArticles">
            <div 
              class="article-card" 
              *ngFor="let article of recentArticles"
              [routerLink]="['/articles', article._id]"
            >
              <div class="article-meta">
                <span class="status-badge" [class]="getArticleStatusClass(article)">
                  {{ getArticleStatusText(article) }}
                </span>
                <span class="date">{{ formatDate(article.createdAt) }}</span>
              </div>
              <h3>{{ article.title }}</h3>
              <p class="excerpt">{{ getArticleExcerpt(article.content) }}</p>
              <div class="article-stats">
                <span><i class="fas fa-eye"></i> {{ article.views || 0 }}</span>
                <span><i class="fas fa-comment"></i> {{ article.commentsCount || 0 }}</span>
                <span><i class="fas fa-heart"></i> {{ article.likesCount || 0 }}</span>
              </div>
            </div>
          </div>

          <ng-template #noArticles>
            <div class="empty-state">
              <i class="fas fa-newspaper"></i>
              <h3>No articles yet</h3>
              <p>Start writing your first article to see it here</p>
              <button 
                *ngIf="canCreateArticles()"
                routerLink="/articles/create"
                class="btn btn-primary"
              >
                Create Your First Article
              </button>
            </div>
          </ng-template>
        </div>

        <!-- Activity Feed -->
        <div class="content-section">
          <div class="section-header">
            <h2>Recent Activity</h2>
          </div>
          
          <div class="activity-feed">
            <div class="activity-item" *ngFor="let activity of recentActivity">
              <div class="activity-icon" [class]="getActivityIconClass(activity.type)">
                <i [class]="getActivityIcon(activity.type)"></i>
              </div>
              <div class="activity-content">
                <p class="activity-text">{{ activity.message }}</p>
                <span class="activity-time">{{ formatDate(activity.timestamp) }}</span>
              </div>
            </div>

            <div class="empty-state" *ngIf="recentActivity.length === 0">
              <i class="fas fa-bell"></i>
              <p>No recent activity</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Links -->
      <div class="quick-links-section">
        <h2>Quick Links</h2>
        <div class="quick-links-grid">
          <a routerLink="/articles" class="quick-link-card">
            <i class="fas fa-newspaper"></i>
            <span>Browse Articles</span>
          </a>
          
          <a routerLink="/profile" class="quick-link-card">
            <i class="fas fa-user-edit"></i>
            <span>Edit Profile</span>
          </a>
          
          <a 
            *ngIf="hasAdminAccess()"
            routerLink="/admin"
            class="quick-link-card"
          >
            <i class="fas fa-cog"></i>
            <span>Admin Panel</span>
          </a>
          
          <a 
            *ngIf="canCreateArticles()"
            routerLink="/articles/create"
            class="quick-link-card"
          >
            <i class="fas fa-plus"></i>
            <span>New Article</span>
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 12px;
      color: white;
    }

    .welcome-section h1 {
      margin: 0 0 8px 0;
      font-size: 1.8rem;
      font-weight: 600;
    }

    .role-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(255, 255, 255, 0.2);
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 500;
    }

    .role-badge.admin { background: rgba(231, 76, 60, 0.2); }
    .role-badge.editor { background: rgba(52, 152, 219, 0.2); }
    .role-badge.writer { background: rgba(46, 204, 113, 0.2); }
    .role-badge.reader { background: rgba(155, 89, 182, 0.2); }

    .quick-actions {
      display: flex;
      gap: 12px;
    }

    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
      font-size: 0.9rem;
    }

    .btn-primary {
      background: white;
      color: #667eea;
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .btn-secondary {
      background: rgba(255, 255, 255, 0.2);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.3);
    }

    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.3);
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }

    .stat-card {
      background: white;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
      border: 1px solid #f0f0f0;
      display: flex;
      align-items: center;
      gap: 16px;
      transition: transform 0.3s ease;
    }

    .stat-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
    }

    .stat-icon {
      width: 50px;
      height: 50px;
      border-radius: 10px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 1.2rem;
    }

    .stat-content h3 {
      font-size: 2rem;
      font-weight: 700;
      margin: 0;
      color: #2c3e50;
    }

    .stat-content p {
      margin: 4px 0 0 0;
      color: #666;
      font-size: 0.9rem;
    }

    .content-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 30px;
      margin-bottom: 40px;
    }

    .content-section {
      background: white;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
      border: 1px solid #f0f0f0;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 12px;
      border-bottom: 2px solid #f8f9fa;
    }

    .section-header h2 {
      margin: 0;
      font-size: 1.3rem;
      color: #2c3e50;
    }

    .view-all-link {
      color: #667eea;
      text-decoration: none;
      font-weight: 600;
      font-size: 0.9rem;
    }

    .view-all-link:hover {
      text-decoration: underline;
    }

    .articles-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .article-card {
      border: 1px solid #e9ecef;
      border-radius: 8px;
      padding: 16px;
      cursor: pointer;
      transition: all 0.3s ease;
      text-decoration: none;
      color: inherit;
    }

    .article-card:hover {
      border-color: #667eea;
      transform: translateX(4px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.1);
    }

    .article-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .status-badge {
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .status-badge.published {
      background: #d4edda;
      color: #155724;
    }

    .status-badge.draft {
      background: #fff3cd;
      color: #856404;
    }

    .date {
      font-size: 0.8rem;
      color: #666;
    }

    .article-card h3 {
      margin: 0 0 8px 0;
      font-size: 1.1rem;
      color: #2c3e50;
    }

    .excerpt {
      color: #666;
      font-size: 0.9rem;
      margin: 0 0 12px 0;
      line-height: 1.4;
    }

    .article-stats {
      display: flex;
      gap: 16px;
      font-size: 0.8rem;
      color: #888;
    }

    .activity-feed {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .activity-item {
      display: flex;
      gap: 12px;
      align-items: flex-start;
    }

    .activity-icon {
      width: 32px;
      height: 32px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 0.8rem;
      flex-shrink: 0;
    }

    .activity-icon.comment { background: #3498db; }
    .activity-icon.like { background: #e74c3c; }
    .activity-icon.publish { background: #27ae60; }

    .activity-content {
      flex: 1;
    }

    .activity-text {
      margin: 0 0 4px 0;
      font-size: 0.9rem;
      color: #333;
    }

    .activity-time {
      font-size: 0.8rem;
      color: #666;
    }

    .empty-state {
      text-align: center;
      padding: 40px 20px;
      color: #666;
    }

    .empty-state i {
      font-size: 3rem;
      margin-bottom: 16px;
      color: #ddd;
    }

    .empty-state h3 {
      margin: 0 0 8px 0;
      color: #333;
    }

    .empty-state p {
      margin: 0 0 20px 0;
    }

    .quick-links-section {
      background: white;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
      border: 1px solid #f0f0f0;
    }

    .quick-links-section h2 {
      margin: 0 0 20px 0;
      font-size: 1.3rem;
      color: #2c3e50;
    }

    .quick-links-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 16px;
    }

    .quick-link-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 20px;
      border: 2px solid #f0f0f0;
      border-radius: 8px;
      text-decoration: none;
      color: #333;
      transition: all 0.3s ease;
    }

    .quick-link-card:hover {
      border-color: #667eea;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.1);
    }

    .quick-link-card i {
      font-size: 1.5rem;
      color: #667eea;
    }

    .quick-link-card span {
      font-weight: 600;
      font-size: 0.9rem;
    }

    @media (max-width: 768px) {
      .dashboard-container {
        padding: 16px;
      }

      .dashboard-header {
        flex-direction: column;
        gap: 16px;
        text-align: center;
      }

      .quick-actions {
        width: 100%;
        justify-content: center;
      }

      .content-grid {
        grid-template-columns: 1fr;
        gap: 20px;
      }

      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .quick-links-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private articleService = inject(ArticleService);
  private destroy$ = new Subject<void>();

  currentUser: User | null = null;
  recentArticles: Article[] = [];
  userStats = {
    totalArticles: 0,
    totalViews: 0,
    totalComments: 0,
    totalLikes: 0
  };
  recentActivity: any[] = [];

  ngOnInit(): void {
    this.loadUserData();
    this.loadUserStats();
    this.loadRecentActivity();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadUserData(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
        if (user) {
          this.loadRecentArticles();
        }
      });
  }

  private loadRecentArticles(): void {
    if (!this.currentUser) return;
    
    // Load user's recent articles
    this.articleService.getMyArticles({ limit: 5 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.recentArticles = response.articles;
        },
        error: (error) => {
          console.error('Error loading recent articles:', error);
        }
      });
  }

  private loadUserStats(): void {
    // Mock stats for now - implement actual stats API
    this.userStats = {
      totalArticles: this.recentArticles.length,
      totalViews: Math.floor(Math.random() * 1000) + 100,
      totalComments: Math.floor(Math.random() * 50) + 10,
      totalLikes: Math.floor(Math.random() * 200) + 20
    };
  }

  private loadRecentActivity(): void {
    // Mock activity for now - implement actual activity API
    this.recentActivity = [
      {
        type: 'comment',
        message: 'New comment on "Your Article Title"',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
      },
      {
        type: 'like',
        message: 'Someone liked your article',
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000)
      },
      {
        type: 'publish',
        message: 'Article "Sample Title" was published',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000)
      }
    ];
  }

  canCreateArticles(): boolean {
    return this.authService.hasRole(UserRole.WRITER);
  }

  hasAdminAccess(): boolean {
    return this.authService.hasRole(UserRole.ADMIN);
  }

  getRoleClass(): string {
    return this.currentUser?.role.toLowerCase() || 'reader';
  }

  getRoleIcon(): string {
    const icons = {
      [UserRole.ADMIN]: 'fas fa-crown',
      [UserRole.EDITOR]: 'fas fa-edit',
      [UserRole.WRITER]: 'fas fa-pen',
      [UserRole.READER]: 'fas fa-book'
    };
    return icons[this.currentUser?.role || UserRole.READER];
  }

  getRoleDisplayName(): string {
    const names = {
      [UserRole.ADMIN]: 'Administrator',
      [UserRole.EDITOR]: 'Editor',
      [UserRole.WRITER]: 'Writer',
      [UserRole.READER]: 'Reader'
    };
    return names[this.currentUser?.role || UserRole.READER];
  }

  getArticleStatusClass(article: Article): string {
    return article.publishedAt ? 'published' : 'draft';
  }

  getArticleStatusText(article: Article): string {
    return article.publishedAt ? 'Published' : 'Draft';
  }

  getArticleExcerpt(content: string): string {
    return content.substring(0, 120) + (content.length > 120 ? '...' : '');
  }

  getActivityIconClass(type: string): string {
    return `activity-icon ${type}`;
  }

  getActivityIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'comment': 'fas fa-comment',
      'like': 'fas fa-heart',
      'publish': 'fas fa-rocket'
    };
    return icons[type] || 'fas fa-bell';
  }

  formatDate(date: Date | string): string {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  }
}