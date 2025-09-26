import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { UserManagementComponent } from './user-management.component';
import { AnalyticsDashboardComponent } from '../analytics/analytics-dashboard.component';

interface DashboardStats {
  totalUsers: number;
  totalArticles: number;
  totalComments: number;
  activeUsers: number;
  recentActivity: ActivityItem[];
  systemHealth: SystemHealth;
}

interface ActivityItem {
  id: string;
  type: 'user_created' | 'article_published' | 'comment_added' | 'user_login';
  description: string;
  timestamp: string;
  user?: string;
}

interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  uptime: string;
  memoryUsage: number;
  diskUsage: number;
  responseTime: number;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, UserManagementComponent, AnalyticsDashboardComponent],
  template: `
    <div class="admin-dashboard">
      <!-- Navigation Tabs -->
      <div class="admin-nav">
        <h1>Admin Dashboard</h1>
        <div class="nav-tabs">
          <button 
            class="nav-tab" 
            [class.active]="activeTab === 'overview'"
            (click)="setActiveTab('overview')">
            📊 Overview
          </button>
          <button 
            class="nav-tab" 
            [class.active]="activeTab === 'users'"
            (click)="setActiveTab('users')">
            👥 User Management
          </button>
          <button 
            class="nav-tab" 
            [class.active]="activeTab === 'content'"
            (click)="setActiveTab('content')">
            📝 Content Management
          </button>
          <button 
            class="nav-tab" 
            [class.active]="activeTab === 'analytics'"
            (click)="setActiveTab('analytics')">
            📈 Analytics
          </button>
          <button 
            class="nav-tab" 
            [class.active]="activeTab === 'settings'"
            (click)="setActiveTab('settings')">
            ⚙️ Settings
          </button>
        </div>
      </div>

      <!-- Overview Tab -->
      <div *ngIf="activeTab === 'overview'" class="tab-content">
        <!-- Stats Cards -->
        <div class="stats-grid">
          <div class="stat-card users">
            <div class="stat-icon">👥</div>
            <div class="stat-content">
              <h3>{{dashboardStats.totalUsers}}</h3>
              <p>Total Users</p>
              <span class="stat-change positive">+{{dashboardStats.activeUsers}} active</span>
            </div>
          </div>
          
          <div class="stat-card articles">
            <div class="stat-icon">📝</div>
            <div class="stat-content">
              <h3>{{dashboardStats.totalArticles}}</h3>
              <p>Total Articles</p>
              <span class="stat-change positive">+12 this week</span>
            </div>
          </div>
          
          <div class="stat-card comments">
            <div class="stat-icon">💬</div>
            <div class="stat-content">
              <h3>{{dashboardStats.totalComments}}</h3>
              <p>Total Comments</p>
              <span class="stat-change positive">+45 today</span>
            </div>
          </div>
          
          <div class="stat-card health">
            <div class="stat-icon">❤️</div>
            <div class="stat-content">
              <h3>{{dashboardStats.systemHealth.status}}</h3>
              <p>System Health</p>
              <span class="stat-change">{{dashboardStats.systemHealth.uptime}} uptime</span>
            </div>
          </div>
        </div>

        <!-- System Health Panel -->
        <div class="health-panel">
          <h3>System Health Monitor</h3>
          <div class="health-metrics">
            <div class="metric">
              <label>Memory Usage</label>
              <div class="progress-bar">
                <div class="progress" [style.width.%]="dashboardStats.systemHealth.memoryUsage"></div>
              </div>
              <span>{{dashboardStats.systemHealth.memoryUsage}}%</span>
            </div>
            
            <div class="metric">
              <label>Disk Usage</label>
              <div class="progress-bar">
                <div class="progress" [style.width.%]="dashboardStats.systemHealth.diskUsage"></div>
              </div>
              <span>{{dashboardStats.systemHealth.diskUsage}}%</span>
            </div>
            
            <div class="metric">
              <label>Response Time</label>
              <div class="response-time">{{dashboardStats.systemHealth.responseTime}}ms</div>
            </div>
          </div>
        </div>

        <!-- Recent Activity -->
        <div class="activity-panel">
          <h3>Recent Activity</h3>
          <div class="activity-list">
            <div *ngFor="let activity of dashboardStats.recentActivity" class="activity-item">
              <div class="activity-icon" [class]="getActivityIconClass(activity.type)">
                {{getActivityIcon(activity.type)}}
              </div>
              <div class="activity-content">
                <p>{{activity.description}}</p>
                <span class="activity-time">{{formatActivityTime(activity.timestamp)}}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- User Management Tab -->
      <div *ngIf="activeTab === 'users'" class="tab-content">
        <app-user-management></app-user-management>
      </div>

      <!-- Content Management Tab -->
      <div *ngIf="activeTab === 'content'" class="tab-content">
        <div class="content-management">
          <h2>Content Management</h2>
          <div class="content-actions">
            <button class="action-btn">📝 Manage Articles</button>
            <button class="action-btn">💬 Moderate Comments</button>
            <button class="action-btn">🏷️ Manage Categories</button>
            <button class="action-btn">📋 Content Reports</button>
          </div>
          
          <div class="content-stats">
            <div class="content-stat">
              <h4>Articles by Status</h4>
              <div class="status-list">
                <div class="status-item">
                  <span class="status-dot published"></span>
                  <span>Published: 156</span>
                </div>
                <div class="status-item">
                  <span class="status-dot draft"></span>
                  <span>Draft: 23</span>
                </div>
                <div class="status-item">
                  <span class="status-dot pending"></span>
                  <span>Pending Review: 8</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Analytics Tab -->
      <div *ngIf="activeTab === 'analytics'" class="tab-content">
        <app-analytics-dashboard></app-analytics-dashboard>
      </div>

      <!-- Settings Tab -->
      <div *ngIf="activeTab === 'settings'" class="tab-content">
        <div class="settings-panel">
          <h2>System Settings</h2>
          <div class="settings-grid">
            <div class="settings-section">
              <h4>General Settings</h4>
              <div class="setting-item">
                <label>Site Name</label>
                <input type="text" value="Collaborative Blog" class="setting-input">
              </div>
              <div class="setting-item">
                <label>Site Description</label>
                <textarea class="setting-textarea">A modern collaborative blogging platform</textarea>
              </div>
            </div>
            
            <div class="settings-section">
              <h4>Security Settings</h4>
              <div class="setting-item">
                <label class="checkbox-label">
                  <input type="checkbox" checked>
                  <span>Enable two-factor authentication</span>
                </label>
              </div>
              <div class="setting-item">
                <label class="checkbox-label">
                  <input type="checkbox" checked>
                  <span>Require email verification</span>
                </label>
              </div>
            </div>
            
            <div class="settings-section">
              <h4>Email Settings</h4>
              <div class="setting-item">
                <label>SMTP Server</label>
                <input type="text" placeholder="smtp.example.com" class="setting-input">
              </div>
              <div class="setting-item">
                <label>SMTP Port</label>
                <input type="number" value="587" class="setting-input">
              </div>
            </div>
          </div>
          
          <div class="settings-actions">
            <button class="btn-secondary">Reset to Defaults</button>
            <button class="btn-primary">Save Settings</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-dashboard {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      color: white;
    }

    .admin-nav {
      padding: 2rem;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    }

    .admin-nav h1 {
      margin: 0 0 1.5rem 0;
      font-size: 2.5rem;
      font-weight: 600;
    }

    .nav-tabs {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .nav-tab {
      background: rgba(255, 255, 255, 0.1);
      color: white;
      border: none;
      padding: 1rem 1.5rem;
      border-radius: 25px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.3s ease;
      border: 2px solid transparent;
    }

    .nav-tab:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: translateY(-2px);
    }

    .nav-tab.active {
      background: rgba(255, 255, 255, 0.9);
      color: #333;
      border-color: rgba(255, 255, 255, 0.3);
    }

    .tab-content {
      padding: 2rem;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 2rem;
      margin-bottom: 3rem;
    }

    .stat-card {
      background: rgba(255, 255, 255, 0.95);
      color: #333;
      padding: 2rem;
      border-radius: 20px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
      display: flex;
      align-items: center;
      gap: 1.5rem;
      transition: transform 0.3s ease;
    }

    .stat-card:hover {
      transform: translateY(-5px);
    }

    .stat-icon {
      font-size: 3rem;
      width: 80px;
      height: 80px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .stat-content h3 {
      margin: 0;
      font-size: 2.5rem;
      font-weight: 700;
    }

    .stat-content p {
      margin: 0.5rem 0;
      color: #666;
      font-weight: 500;
    }

    .stat-change {
      font-size: 0.875rem;
      padding: 0.25rem 0.75rem;
      border-radius: 15px;
      font-weight: 500;
    }

    .stat-change.positive {
      background: #d4edda;
      color: #155724;
    }

    .health-panel, .activity-panel {
      background: rgba(255, 255, 255, 0.95);
      color: #333;
      padding: 2rem;
      border-radius: 20px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
      margin-bottom: 2rem;
    }

    .health-panel h3, .activity-panel h3 {
      margin: 0 0 1.5rem 0;
      color: #333;
      font-size: 1.5rem;
    }

    .health-metrics {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 2rem;
    }

    .metric {
      background: #f8f9ff;
      padding: 1.5rem;
      border-radius: 15px;
      border-left: 4px solid #667eea;
    }

    .metric label {
      display: block;
      margin-bottom: 0.75rem;
      font-weight: 600;
      color: #333;
    }

    .progress-bar {
      width: 100%;
      height: 8px;
      background: #e9ecef;
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 0.5rem;
    }

    .progress {
      height: 100%;
      background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
      transition: width 0.3s ease;
    }

    .response-time {
      font-size: 1.5rem;
      font-weight: 700;
      color: #667eea;
    }

    .activity-list {
      max-height: 400px;
      overflow-y: auto;
    }

    .activity-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      border-bottom: 1px solid #eee;
      transition: background-color 0.3s ease;
    }

    .activity-item:hover {
      background: #f8f9ff;
    }

    .activity-icon {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      color: white;
    }

    .activity-icon.user { background: #3498db; }
    .activity-icon.article { background: #2ecc71; }
    .activity-icon.comment { background: #f39c12; }
    .activity-icon.login { background: #9b59b6; }

    .activity-content p {
      margin: 0;
      font-weight: 500;
    }

    .activity-time {
      font-size: 0.875rem;
      color: #666;
    }

    .content-management, .analytics-dashboard, .settings-panel {
      background: rgba(255, 255, 255, 0.95);
      color: #333;
      padding: 2rem;
      border-radius: 20px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    }

    .content-actions {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin: 2rem 0;
    }

    .action-btn {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 1rem;
      border-radius: 15px;
      cursor: pointer;
      font-weight: 500;
      transition: transform 0.3s ease;
    }

    .action-btn:hover {
      transform: translateY(-3px);
    }

    .content-stats {
      margin-top: 2rem;
    }

    .status-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .status-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .status-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
    }

    .status-dot.published { background: #27ae60; }
    .status-dot.draft { background: #f39c12; }
    .status-dot.pending { background: #e74c3c; }

    .analytics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 2rem;
      margin-top: 2rem;
    }

    .analytics-card {
      background: #f8f9ff;
      padding: 1.5rem;
      border-radius: 15px;
      border-left: 4px solid #667eea;
    }

    .chart-placeholder {
      height: 200px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #e9ecef;
      border-radius: 10px;
      margin-top: 1rem;
      color: #666;
    }

    .top-list {
      margin-top: 1rem;
    }

    .top-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem;
      border-bottom: 1px solid #eee;
    }

    .rank {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background: #667eea;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
    }

    .title {
      flex: 1;
      font-weight: 500;
    }

    .views {
      color: #666;
      font-size: 0.875rem;
    }

    .settings-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 2rem;
      margin: 2rem 0;
    }

    .settings-section {
      background: #f8f9ff;
      padding: 1.5rem;
      border-radius: 15px;
      border-left: 4px solid #667eea;
    }

    .settings-section h4 {
      margin: 0 0 1rem 0;
      color: #667eea;
    }

    .setting-item {
      margin-bottom: 1rem;
    }

    .setting-item label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
    }

    .setting-input, .setting-textarea {
      width: 100%;
      padding: 0.75rem;
      border: 2px solid #ddd;
      border-radius: 8px;
      font-size: 1rem;
    }

    .setting-textarea {
      height: 80px;
      resize: vertical;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      cursor: pointer;
    }

    .settings-actions {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
      margin-top: 2rem;
      padding-top: 2rem;
      border-top: 2px solid #eee;
    }

    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 25px;
      cursor: pointer;
      font-weight: 500;
    }

    .btn-secondary {
      background: transparent;
      color: #667eea;
      border: 2px solid #667eea;
      padding: 0.75rem 1.5rem;
      border-radius: 25px;
      cursor: pointer;
      font-weight: 500;
    }

    @media (max-width: 768px) {
      .admin-dashboard {
        padding: 1rem;
      }

      .nav-tabs {
        flex-direction: column;
      }

      .stats-grid {
        grid-template-columns: 1fr;
      }

      .health-metrics {
        grid-template-columns: 1fr;
      }

      .analytics-grid {
        grid-template-columns: 1fr;
      }

      .settings-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  activeTab = 'overview';
  dashboardStats: DashboardStats = {
    totalUsers: 0,
    totalArticles: 0,
    totalComments: 0,
    activeUsers: 0,
    recentActivity: [],
    systemHealth: {
      status: 'healthy',
      uptime: '0h 0m',
      memoryUsage: 0,
      diskUsage: 0,
      responseTime: 0
    }
  };

  constructor() {}

  ngOnInit() {
    this.loadDashboardData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }

  loadDashboardData() {
    // Mock data - replace with actual API calls
    this.dashboardStats = {
      totalUsers: 156,
      totalArticles: 89,
      totalComments: 234,
      activeUsers: 45,
      recentActivity: [
        {
          id: '1',
          type: 'user_created',
          description: 'New user "john_doe" registered',
          timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          type: 'article_published',
          description: 'Article "Getting Started with Angular" was published',
          timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString()
        },
        {
          id: '3',
          type: 'comment_added',
          description: 'New comment on "React vs Vue"',
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString()
        },
        {
          id: '4',
          type: 'user_login',
          description: 'User "editor1" logged in',
          timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString()
        }
      ],
      systemHealth: {
        status: 'healthy',
        uptime: '15h 32m',
        memoryUsage: 68,
        diskUsage: 45,
        responseTime: 142
      }
    };
  }

  getActivityIcon(type: string): string {
    const icons = {
      'user_created': '👤',
      'article_published': '📝',
      'comment_added': '💬',
      'user_login': '🔐'
    };
    return icons[type as keyof typeof icons] || '📌';
  }

  getActivityIconClass(type: string): string {
    const classes = {
      'user_created': 'user',
      'article_published': 'article',
      'comment_added': 'comment',
      'user_login': 'login'
    };
    return classes[type as keyof typeof classes] || 'default';
  }

  formatActivityTime(timestamp: string): string {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return `${Math.floor(diffMinutes / 1440)}d ago`;
  }
}