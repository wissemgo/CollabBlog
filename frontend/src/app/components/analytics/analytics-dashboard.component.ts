import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface AnalyticsData {
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalArticles: number;
  growthRate: number;
  topArticles: TopArticle[];
  viewsOverTime: ChartData[];
  userEngagement: EngagementData;
}

interface TopArticle {
  title: string;
  views: number;
  likes: number;
  comments: number;
}

interface ChartData {
  date: string;
  views: number;
  articles: number;
}

interface EngagementData {
  bounceRate: number;
  avgTimeOnPage: number;
  returningUsers: number;
  newUsers: number;
}

@Component({
  selector: 'app-analytics-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="analytics-container">
      <div class="analytics-header">
        <h1>📊 Analytics Dashboard</h1>
        <p>Insights and performance metrics for your content</p>
      </div>

      <!-- Key Metrics Cards -->
      <div class="metrics-grid">
        <div class="metric-card views">
          <div class="metric-icon">👁️</div>
          <div class="metric-content">
            <h3>{{analytics.totalViews | number}}</h3>
            <p>Total Views</p>
            <span class="growth positive">+{{analytics.growthRate}}% this month</span>
          </div>
        </div>

        <div class="metric-card articles">
          <div class="metric-icon">📝</div>
          <div class="metric-content">
            <h3>{{analytics.totalArticles}}</h3>
            <p>Published Articles</p>
            <span class="growth positive">+5 this week</span>
          </div>
        </div>

        <div class="metric-card likes">
          <div class="metric-icon">❤️</div>
          <div class="metric-content">
            <h3>{{analytics.totalLikes | number}}</h3>
            <p>Total Likes</p>
            <span class="growth positive">+12% engagement</span>
          </div>
        </div>

        <div class="metric-card comments">
          <div class="metric-icon">💬</div>
          <div class="metric-content">
            <h3>{{analytics.totalComments | number}}</h3>
            <p>Total Comments</p>
            <span class="growth positive">High interaction</span>
          </div>
        </div>
      </div>

      <!-- Charts Section -->
      <div class="charts-section">
        <div class="chart-container">
          <h3>📈 Views Over Time</h3>
          <div class="simple-chart">
            <div class="chart-bars">
              <div *ngFor="let data of analytics.viewsOverTime" 
                   class="chart-bar" 
                   [style.height.%]="(data.views / getMaxViews()) * 100"
                   [title]="data.date + ': ' + data.views + ' views'">
              </div>
            </div>
            <div class="chart-labels">
              <span *ngFor="let data of analytics.viewsOverTime">
                {{formatDate(data.date)}}
              </span>
            </div>
          </div>
        </div>

        <div class="engagement-container">
          <h3>👥 User Engagement</h3>
          <div class="engagement-metrics">
            <div class="engagement-item">
              <span class="label">Bounce Rate</span>
              <div class="progress-bar">
                <div class="progress" [style.width.%]="analytics.userEngagement.bounceRate"></div>
              </div>
              <span class="value">{{analytics.userEngagement.bounceRate}}%</span>
            </div>
            
            <div class="engagement-item">
              <span class="label">Avg. Time on Page</span>
              <div class="time-display">{{analytics.userEngagement.avgTimeOnPage}} min</div>
            </div>
            
            <div class="user-split">
              <div class="user-type returning">
                <span class="count">{{analytics.userEngagement.returningUsers}}%</span>
                <span class="label">Returning Users</span>
              </div>
              <div class="user-type new">
                <span class="count">{{analytics.userEngagement.newUsers}}%</span>
                <span class="label">New Users</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Top Articles -->
      <div class="top-articles-section">
        <h3>🏆 Top Performing Articles</h3>
        <div class="articles-table">
          <div class="table-header">
            <span>Article</span>
            <span>Views</span>
            <span>Likes</span>
            <span>Comments</span>
            <span>Performance</span>
          </div>
          
          <div *ngFor="let article of analytics.topArticles; let i = index" 
               class="table-row">
            <div class="article-info">
              <span class="rank">#{{i + 1}}</span>
              <span class="title">{{article.title}}</span>
            </div>
            <span class="views">{{article.views | number}}</span>
            <span class="likes">{{article.likes}}</span>
            <span class="comments">{{article.comments}}</span>
            <div class="performance-indicator">
              <div class="performance-bar" 
                   [style.width.%]="(article.views / getTopViews()) * 100">
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Additional Insights -->
      <div class="insights-section">
        <div class="insight-card">
          <h4>📅 Best Publishing Days</h4>
          <div class="days-chart">
            <div *ngFor="let day of ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']" 
                 class="day-bar" 
                 [class.active]="day === 'Wed' || day === 'Thu'">
              <div class="bar"></div>
              <span>{{day}}</span>
            </div>
          </div>
          <p>Wednesday and Thursday show highest engagement</p>
        </div>

        <div class="insight-card">
          <h4>⏰ Peak Activity Hours</h4>
          <div class="hours-display">
            <div class="hour-block peak">9-11 AM</div>
            <div class="hour-block high">2-4 PM</div>
            <div class="hour-block medium">7-9 PM</div>
          </div>
          <p>Peak engagement during morning and afternoon hours</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .analytics-container {
      padding: 2rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      color: white;
    }

    .analytics-header {
      text-align: center;
      margin-bottom: 3rem;
      padding: 2rem;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      backdrop-filter: blur(10px);
    }

    .analytics-header h1 {
      font-size: 3rem;
      margin: 0 0 1rem 0;
      font-weight: 700;
    }

    .analytics-header p {
      font-size: 1.2rem;
      opacity: 0.9;
      margin: 0;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 2rem;
      margin-bottom: 3rem;
    }

    .metric-card {
      background: rgba(255, 255, 255, 0.95);
      color: #333;
      padding: 2rem;
      border-radius: 20px;
      display: flex;
      align-items: center;
      gap: 1.5rem;
      box-shadow: 0 15px 40px rgba(0, 0, 0, 0.1);
      transition: transform 0.3s ease;
    }

    .metric-card:hover {
      transform: translateY(-5px);
    }

    .metric-icon {
      font-size: 3rem;
      width: 80px;
      height: 80px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .metric-content h3 {
      margin: 0;
      font-size: 2.5rem;
      font-weight: 700;
      color: #333;
    }

    .metric-content p {
      margin: 0.5rem 0;
      color: #666;
      font-weight: 500;
    }

    .growth {
      font-size: 0.9rem;
      padding: 0.25rem 0.75rem;
      border-radius: 15px;
      font-weight: 500;
    }

    .growth.positive {
      background: #d4edda;
      color: #155724;
    }

    .charts-section {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 2rem;
      margin-bottom: 3rem;
    }

    .chart-container, .engagement-container {
      background: rgba(255, 255, 255, 0.95);
      color: #333;
      padding: 2rem;
      border-radius: 20px;
      box-shadow: 0 15px 40px rgba(0, 0, 0, 0.1);
    }

    .chart-container h3, .engagement-container h3 {
      margin: 0 0 1.5rem 0;
      color: #333;
      font-size: 1.5rem;
    }

    .simple-chart {
      height: 200px;
    }

    .chart-bars {
      display: flex;
      align-items: end;
      height: 160px;
      gap: 0.5rem;
      padding: 1rem 0;
    }

    .chart-bar {
      flex: 1;
      background: linear-gradient(to top, #667eea 0%, #764ba2 100%);
      border-radius: 4px 4px 0 0;
      min-height: 10px;
      transition: all 0.3s ease;
      cursor: pointer;
    }

    .chart-bar:hover {
      opacity: 0.8;
      transform: scaleY(1.05);
    }

    .chart-labels {
      display: flex;
      justify-content: space-between;
      font-size: 0.8rem;
      color: #666;
      margin-top: 0.5rem;
    }

    .engagement-metrics {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .engagement-item {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .engagement-item .label {
      font-weight: 600;
      color: #333;
    }

    .progress-bar {
      width: 100%;
      height: 8px;
      background: #e9ecef;
      border-radius: 4px;
      overflow: hidden;
    }

    .progress {
      height: 100%;
      background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
      transition: width 0.3s ease;
    }

    .engagement-item .value {
      font-weight: 700;
      color: #667eea;
    }

    .time-display {
      font-size: 2rem;
      font-weight: 700;
      color: #667eea;
      text-align: center;
      padding: 1rem;
      background: #f8f9ff;
      border-radius: 10px;
    }

    .user-split {
      display: flex;
      gap: 1rem;
    }

    .user-type {
      flex: 1;
      text-align: center;
      padding: 1rem;
      border-radius: 10px;
    }

    .user-type.returning {
      background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);
      color: white;
    }

    .user-type.new {
      background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
      color: white;
    }

    .user-type .count {
      display: block;
      font-size: 2rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }

    .user-type .label {
      font-size: 0.9rem;
      opacity: 0.9;
    }

    .top-articles-section {
      background: rgba(255, 255, 255, 0.95);
      color: #333;
      padding: 2rem;
      border-radius: 20px;
      box-shadow: 0 15px 40px rgba(0, 0, 0, 0.1);
      margin-bottom: 3rem;
    }

    .top-articles-section h3 {
      margin: 0 0 1.5rem 0;
      color: #333;
      font-size: 1.5rem;
    }

    .articles-table {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .table-header {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr 1.5fr;
      gap: 1rem;
      padding: 1rem;
      background: #f8f9ff;
      border-radius: 10px;
      font-weight: 600;
      color: #333;
    }

    .table-row {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr 1.5fr;
      gap: 1rem;
      padding: 1rem;
      align-items: center;
      border-bottom: 1px solid #f0f0f0;
      transition: background-color 0.3s ease;
    }

    .table-row:hover {
      background: #f8f9ff;
    }

    .article-info {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .rank {
      font-weight: 700;
      color: #667eea;
      font-size: 1.1rem;
    }

    .title {
      font-weight: 500;
      color: #333;
    }

    .performance-indicator {
      background: #e9ecef;
      border-radius: 4px;
      height: 8px;
      overflow: hidden;
    }

    .performance-bar {
      height: 100%;
      background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
      transition: width 0.3s ease;
    }

    .insights-section {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 2rem;
    }

    .insight-card {
      background: rgba(255, 255, 255, 0.95);
      color: #333;
      padding: 2rem;
      border-radius: 20px;
      box-shadow: 0 15px 40px rgba(0, 0, 0, 0.1);
    }

    .insight-card h4 {
      margin: 0 0 1.5rem 0;
      color: #333;
      font-size: 1.3rem;
    }

    .days-chart {
      display: flex;
      justify-content: space-between;
      margin-bottom: 1rem;
    }

    .day-bar {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }

    .day-bar .bar {
      width: 20px;
      height: 40px;
      background: #e9ecef;
      border-radius: 4px;
      transition: all 0.3s ease;
    }

    .day-bar.active .bar {
      background: linear-gradient(to top, #667eea 0%, #764ba2 100%);
      height: 60px;
    }

    .day-bar span {
      font-size: 0.8rem;
      color: #666;
    }

    .hours-display {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .hour-block {
      flex: 1;
      padding: 1rem;
      text-align: center;
      border-radius: 10px;
      font-weight: 600;
      color: white;
    }

    .hour-block.peak {
      background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
    }

    .hour-block.high {
      background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);
    }

    .hour-block.medium {
      background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
    }

    .insight-card p {
      color: #666;
      font-size: 0.9rem;
      line-height: 1.5;
      margin: 0;
    }

    @media (max-width: 1200px) {
      .charts-section {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 768px) {
      .analytics-container {
        padding: 1rem;
      }

      .analytics-header h1 {
        font-size: 2rem;
      }

      .metrics-grid {
        grid-template-columns: 1fr;
      }

      .metric-card {
        flex-direction: column;
        text-align: center;
      }

      .table-header,
      .table-row {
        grid-template-columns: 1fr;
        gap: 0.5rem;
      }

      .hours-display {
        flex-direction: column;
      }
    }
  `]
})
export class AnalyticsDashboardComponent implements OnInit {
  analytics: AnalyticsData = {
    totalViews: 0,
    totalLikes: 0,
    totalComments: 0,
    totalArticles: 0,
    growthRate: 0,
    topArticles: [],
    viewsOverTime: [],
    userEngagement: {
      bounceRate: 0,
      avgTimeOnPage: 0,
      returningUsers: 0,
      newUsers: 0
    }
  };

  ngOnInit() {
    this.loadAnalyticsData();
  }

  loadAnalyticsData() {
    // Mock data - replace with actual API calls
    this.analytics = {
      totalViews: 125430,
      totalLikes: 3842,
      totalComments: 1567,
      totalArticles: 89,
      growthRate: 23.5,
      topArticles: [
        { title: 'Getting Started with Angular 18', views: 15432, likes: 245, comments: 67 },
        { title: 'Advanced TypeScript Tips', views: 12890, likes: 198, comments: 45 },
        { title: 'Modern CSS Layouts', views: 10567, likes: 176, comments: 38 },
        { title: 'React vs Angular Comparison', views: 9876, likes: 154, comments: 52 },
        { title: 'Node.js Best Practices', views: 8543, likes: 132, comments: 29 }
      ],
      viewsOverTime: [
        { date: '2024-01-15', views: 1200, articles: 5 },
        { date: '2024-01-16', views: 1450, articles: 3 },
        { date: '2024-01-17', views: 1650, articles: 7 },
        { date: '2024-01-18', views: 1890, articles: 4 },
        { date: '2024-01-19', views: 2100, articles: 6 },
        { date: '2024-01-20', views: 1980, articles: 2 },
        { date: '2024-01-21', views: 2250, articles: 8 }
      ],
      userEngagement: {
        bounceRate: 32,
        avgTimeOnPage: 4.2,
        returningUsers: 68,
        newUsers: 32
      }
    };
  }

  getMaxViews(): number {
    return Math.max(...this.analytics.viewsOverTime.map(d => d.views));
  }

  getTopViews(): number {
    return Math.max(...this.analytics.topArticles.map(a => a.views));
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}