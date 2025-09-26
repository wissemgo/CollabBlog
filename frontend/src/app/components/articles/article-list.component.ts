/**
 * Article List Component
 * Displays a list of all published articles
 */

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { ArticleService } from '../../services/article.service';
import { Article, ArticleFilters } from '../../models';
import { SearchFiltersComponent } from '../search/search-filters.component';

@Component({
  selector: 'app-article-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SearchFiltersComponent],
  template: `
    <div class="articles-container">
      <div class="articles-header">
        <h1>Discover Amazing Articles</h1>
        <p class="header-subtitle">Explore our collection of insightful articles from talented writers</p>
      </div>

      <!-- Advanced Search and Filters -->
      <app-search-filters
        [searchResultsCount]="searchResultsCount"
        [searchTime]="searchTime"
        (filtersChange)="onFiltersChange($event)"
        (search)="onQuickSearch($event)">
      </app-search-filters>

      <!-- Articles Grid -->
      <div class="articles-grid" *ngIf="articles.length > 0">
        <div class="article-card" *ngFor="let article of articles; trackBy: trackByArticleId">
          <div class="article-image" *ngIf="article.featuredImage">
            <img [src]="article.featuredImage" [alt]="article.title" loading="lazy">
            <div class="article-overlay">
              <div class="article-category" *ngIf="article.category">
                {{article.category}}
              </div>
            </div>
          </div>
          
          <div class="article-content">
            <div class="article-header">
              <h3>
                <a [routerLink]="['/articles', article._id]">{{ article.title }}</a>
              </h3>
              <div class="article-stats">
                <span class="stat-item" title="Views">
                  <i class="👀"></i> {{article.views || 0}}
                </span>
                <span class="stat-item" title="Likes">
                  <i class="❤️"></i> {{article.likes || 0}}
                </span>
                <span class="stat-item" title="Comments">
                  <i class="💬"></i> {{article.commentsCount || 0}}
                </span>
              </div>
            </div>
            
            <p class="article-summary">{{ article.summary || getPreview(article.content) }}</p>
            
            <div class="article-meta">
              <div class="author-info">
                <div class="author-avatar">
                  {{getAuthorInitial(article.author)}}
                </div>
                <div class="author-details">
                  <span class="author-name">{{ getAuthorName(article.author) }}</span>
                  <span class="publish-date">{{ formatDate(article.publishedAt || article.createdAt) }}</span>
                </div>
              </div>
              <div class="reading-time">
                {{getReadingTime(article.content)}} min read
              </div>
            </div>
            
            <div class="article-tags" *ngIf="article.tags?.length">
              <span class="tag" *ngFor="let tag of article.tags.slice(0, 3)">{{tag}}</span>
              <span class="tag more" *ngIf="article.tags.length > 3">+{{article.tags.length - 3}}</span>
            </div>
            
            <div class="article-actions">
              <button class="action-btn read-more" [routerLink]="['/articles', article._id]">
                Read More
                <i class="→"></i>
              </button>
              <button class="action-btn bookmark" (click)="toggleBookmark(article)" 
                      [class.bookmarked]="isBookmarked(article._id)">
                <i class="🔖"></i>
              </button>
              <button class="action-btn share" (click)="shareArticle(article)">
                <i class="📤"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- No Articles State -->
      <div class="no-articles" *ngIf="articles.length === 0 && !loading">
        <div class="no-articles-icon">📝</div>
        <h3>No articles found</h3>
        <p *ngIf="hasActiveFilters()">Try adjusting your search criteria or clearing some filters.</p>
        <p *ngIf="!hasActiveFilters()">There are no published articles to display yet.</p>
        <button class="btn-primary" (click)="clearFilters()" *ngIf="hasActiveFilters()">
          Clear Filters
        </button>
      </div>

      <!-- Loading State -->
      <div class="loading" *ngIf="loading">
        <div class="loading-spinner"></div>
        <p>Discovering amazing articles...</p>
      </div>

      <!-- Load More Button -->
      <div class="load-more-section" *ngIf="pagination && pagination.hasNext && !loading">
        <button class="load-more-btn" (click)="loadMoreArticles()">
          <span>Load More Articles</span>
          <div class="load-more-icon">⬇️</div>
        </button>
        <p class="load-more-info">
          Showing {{articles.length}} of {{pagination.total}} articles
        </p>
      </div>

      <!-- Pagination (Alternative to Load More) -->
      <div class="pagination" *ngIf="pagination && pagination.pages > 1 && showPagination">
        <button 
          class="pagination-btn"
          [disabled]="pagination.page <= 1"
          (click)="changePage(pagination.page - 1)">
          ← Previous
        </button>
        
        <div class="pagination-info">
          <span>Page {{pagination.page}} of {{pagination.pages}}</span>
          <span class="total-info">({{pagination.total}} articles)</span>
        </div>
        
        <button 
          class="pagination-btn"
          [disabled]="pagination.page >= pagination.pages"
          (click)="changePage(pagination.page + 1)">
          Next →
        </button>
      </div>
    </div>
  `,
  styles: [`
    .articles-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 2rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      color: white;
    }

    .articles-header {
      text-align: center;
      margin-bottom: 3rem;
      padding: 2rem;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      backdrop-filter: blur(10px);
    }

    .articles-header h1 {
      font-size: 3rem;
      margin: 0 0 1rem 0;
      font-weight: 700;
      background: linear-gradient(135deg, #ffffff 0%, #f0f8ff 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .header-subtitle {
      font-size: 1.2rem;
      opacity: 0.9;
      margin: 0;
      font-weight: 300;
    }

    .articles-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
      gap: 2.5rem;
      margin-bottom: 3rem;
    }

    .article-card {
      background: rgba(255, 255, 255, 0.95);
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 15px 40px rgba(0, 0, 0, 0.1);
      transition: all 0.4s ease;
      color: #333;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .article-card:hover {
      transform: translateY(-10px);
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.2);
    }

    .article-image {
      position: relative;
      height: 220px;
      overflow: hidden;
    }

    .article-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.4s ease;
    }

    .article-card:hover .article-image img {
      transform: scale(1.05);
    }

    .article-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(45deg, rgba(102, 126, 234, 0.8) 0%, rgba(118, 75, 162, 0.8) 100%);
      opacity: 0;
      transition: opacity 0.3s ease;
      display: flex;
      align-items: flex-end;
      padding: 1.5rem;
    }

    .article-card:hover .article-overlay {
      opacity: 1;
    }

    .article-category {
      background: rgba(255, 255, 255, 0.9);
      color: #333;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-weight: 600;
      font-size: 0.9rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .article-content {
      padding: 2rem;
    }

    .article-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
      gap: 1rem;
    }

    .article-header h3 {
      flex: 1;
      margin: 0;
      font-size: 1.4rem;
      line-height: 1.4;
    }

    .article-header h3 a {
      color: #333;
      text-decoration: none;
      transition: color 0.3s ease;
    }

    .article-header h3 a:hover {
      color: #667eea;
    }

    .article-stats {
      display: flex;
      gap: 0.75rem;
      flex-shrink: 0;
    }

    .stat-item {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.85rem;
      color: #666;
      background: #f8f9ff;
      padding: 0.25rem 0.5rem;
      border-radius: 15px;
    }

    .article-summary {
      color: #666;
      line-height: 1.7;
      margin-bottom: 1.5rem;
      font-size: 1rem;
    }

    .article-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #f0f0f0;
    }

    .author-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .author-avatar {
      width: 45px;
      height: 45px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 1.1rem;
    }

    .author-details {
      display: flex;
      flex-direction: column;
    }

    .author-name {
      font-weight: 600;
      color: #333;
      font-size: 0.95rem;
    }

    .publish-date {
      color: #888;
      font-size: 0.85rem;
    }

    .reading-time {
      background: #e8f0ff;
      color: #667eea;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 600;
    }

    .article-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
    }

    .tag {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 0.4rem 0.8rem;
      border-radius: 15px;
      font-size: 0.8rem;
      font-weight: 500;
      transition: transform 0.3s ease;
    }

    .tag:hover {
      transform: translateY(-2px);
    }

    .tag.more {
      background: #e9ecef;
      color: #666;
    }

    .article-actions {
      display: flex;
      gap: 1rem;
      align-items: center;
    }

    .action-btn {
      border: none;
      border-radius: 12px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      text-decoration: none;
    }

    .read-more {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 0.75rem 1.5rem;
      flex: 1;
      justify-content: center;
    }

    .read-more:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
    }

    .bookmark, .share {
      background: #f8f9ff;
      color: #667eea;
      border: 2px solid #e8f0ff;
      padding: 0.75rem;
      width: 45px;
      height: 45px;
      justify-content: center;
    }

    .bookmark:hover, .share:hover {
      background: #667eea;
      color: white;
      transform: translateY(-2px);
    }

    .bookmark.bookmarked {
      background: #ffd700;
      color: #333;
      border-color: #ffd700;
    }

    .no-articles {
      text-align: center;
      padding: 4rem 2rem;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      backdrop-filter: blur(10px);
    }

    .no-articles-icon {
      font-size: 4rem;
      margin-bottom: 1.5rem;
      opacity: 0.7;
    }

    .no-articles h3 {
      font-size: 2rem;
      margin: 0 0 1rem 0;
      font-weight: 600;
    }

    .no-articles p {
      font-size: 1.1rem;
      opacity: 0.8;
      margin-bottom: 2rem;
    }

    .loading {
      text-align: center;
      padding: 4rem 2rem;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      backdrop-filter: blur(10px);
    }

    .loading-spinner {
      width: 60px;
      height: 60px;
      border: 4px solid rgba(255, 255, 255, 0.3);
      border-top: 4px solid white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1.5rem;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .loading p {
      font-size: 1.2rem;
      opacity: 0.9;
    }

    .load-more-section {
      text-align: center;
      padding: 2rem;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      backdrop-filter: blur(10px);
      margin-bottom: 2rem;
    }

    .load-more-btn {
      background: rgba(255, 255, 255, 0.9);
      color: #333;
      border: none;
      padding: 1rem 2rem;
      border-radius: 25px;
      cursor: pointer;
      font-weight: 600;
      font-size: 1.1rem;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin: 0 auto 1rem;
    }

    .load-more-btn:hover {
      background: white;
      transform: translateY(-3px);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    }

    .load-more-info {
      opacity: 0.8;
      font-size: 1rem;
    }

    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 2rem;
      padding: 2rem;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      backdrop-filter: blur(10px);
    }

    .pagination-btn {
      background: rgba(255, 255, 255, 0.9);
      color: #333;
      border: none;
      padding: 1rem 2rem;
      border-radius: 25px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.3s ease;
    }

    .pagination-btn:hover:not(:disabled) {
      background: white;
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    }

    .pagination-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .pagination-info {
      text-align: center;
      font-weight: 600;
    }

    .total-info {
      display: block;
      font-size: 0.9rem;
      opacity: 0.8;
      margin-top: 0.25rem;
    }

    .btn-primary {
      background: rgba(255, 255, 255, 0.9);
      color: #333;
      border: none;
      padding: 1rem 2rem;
      border-radius: 25px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.3s ease;
    }

    .btn-primary:hover {
      background: white;
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    }

    @media (max-width: 1200px) {
      .articles-grid {
        grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
        gap: 2rem;
      }
    }

    @media (max-width: 768px) {
      .articles-container {
        padding: 1rem;
      }

      .articles-header h1 {
        font-size: 2rem;
      }

      .articles-grid {
        grid-template-columns: 1fr;
        gap: 1.5rem;
      }

      .article-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }

      .article-stats {
        gap: 0.5rem;
      }

      .article-meta {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }

      .pagination {
        flex-direction: column;
        gap: 1rem;
      }

      .load-more-btn {
        font-size: 1rem;
        padding: 0.875rem 1.5rem;
      }
    }

    @media (max-width: 480px) {
      .article-content {
        padding: 1.5rem;
      }

      .stat-item {
        font-size: 0.8rem;
        padding: 0.2rem 0.4rem;
      }

      .article-actions {
        flex-direction: column;
        gap: 0.75rem;
      }

      .read-more {
        width: 100%;
      }

      .bookmark, .share {
        width: 100%;
        justify-content: center;
      }
    }
  `]
})
export class ArticleListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  articles: Article[] = [];
  allArticles: Article[] = []; // Store all loaded articles for infinite scroll
  loading = false;
  searchTerm = '';
  pagination: any = null;
  currentFilters: any = {};
  searchResultsCount: number | null = null;
  searchTime: number | null = null;
  showPagination = false; // Toggle between load more and pagination
  bookmarkedArticles: Set<string> = new Set();

  constructor(private articleService: ArticleService) {}

  ngOnInit(): void {
    this.loadArticles();
    this.loadBookmarkedArticles();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  trackByArticleId(index: number, article: Article): string {
    return article._id;
  }

  loadArticles(page: number = 1, append: boolean = false): void {
    this.loading = true;
    const startTime = performance.now();
    
    const filters: ArticleFilters = {
      page,
      limit: 12,
      search: this.currentFilters.query || undefined,
      category: this.currentFilters.category || undefined,
      author: this.currentFilters.author || undefined,
      tags: this.currentFilters.tags?.length ? this.currentFilters.tags : undefined,
      sortBy: this.currentFilters.sortBy || 'createdAt',
      sortOrder: this.currentFilters.sortOrder || 'desc'
    };

    // Add date range filtering
    if (this.currentFilters.dateRange) {
      const dateRange = this.getDateRangeFilter(this.currentFilters.dateRange);
      if (dateRange) {
        filters.fromDate = new Date(dateRange.from);
        filters.toDate = new Date(dateRange.to);
      }
    }

    this.articleService.getArticles(filters).subscribe({
      next: (response) => {
        const endTime = performance.now();
        this.searchTime = Math.round(endTime - startTime);
        
        if (append) {
          this.articles = [...this.articles, ...response.articles];
          this.allArticles = [...this.allArticles, ...response.articles];
        } else {
          this.articles = response.articles;
          this.allArticles = response.articles;
        }
        
        this.pagination = response.pagination;
        this.searchResultsCount = response.pagination?.total || this.articles.length;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading articles:', error);
        this.loading = false;
        this.searchResultsCount = 0;
      }
    });
  }

  onFiltersChange(filters: any): void {
    this.currentFilters = { ...filters };
    this.loadArticles(1, false);
  }

  onQuickSearch(query: string): void {
    this.currentFilters = { ...this.currentFilters, query };
    this.loadArticles(1, false);
  }

  onSearch(): void {
    this.currentFilters = { ...this.currentFilters, query: this.searchTerm };
    this.loadArticles(1, false);
  }

  changePage(page: number): void {
    this.loadArticles(page, false);
    // Scroll to top when changing pages
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  loadMoreArticles(): void {
    if (this.pagination && this.pagination.hasNext) {
      this.loadArticles(this.pagination.page + 1, true);
    }
  }

  clearFilters(): void {
    this.currentFilters = {};
    this.searchTerm = '';
    this.loadArticles(1, false);
  }

  hasActiveFilters(): boolean {
    return Object.keys(this.currentFilters).some(key => {
      const value = this.currentFilters[key];
      return value && (typeof value !== 'object' || (Array.isArray(value) && value.length > 0));
    });
  }

  getDateRangeFilter(range: string): { from: string; to: string } | null {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (range) {
      case 'today':
        return {
          from: today.toISOString(),
          to: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString()
        };
      case 'week':
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        return {
          from: weekAgo.toISOString(),
          to: now.toISOString()
        };
      case 'month':
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        return {
          from: monthAgo.toISOString(),
          to: now.toISOString()
        };
      case 'quarter':
        const quarterAgo = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
        return {
          from: quarterAgo.toISOString(),
          to: now.toISOString()
        };
      case 'year':
        const yearAgo = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);
        return {
          from: yearAgo.toISOString(),
          to: now.toISOString()
        };
      default:
        return null;
    }
  }

  toggleBookmark(article: Article): void {
    if (this.isBookmarked(article._id)) {
      this.bookmarkedArticles.delete(article._id);
    } else {
      this.bookmarkedArticles.add(article._id);
    }
    this.saveBookmarkedArticles();
  }

  isBookmarked(articleId: string): boolean {
    return this.bookmarkedArticles.has(articleId);
  }

  saveBookmarkedArticles(): void {
    localStorage.setItem('bookmarkedArticles', JSON.stringify([...this.bookmarkedArticles]));
  }

  loadBookmarkedArticles(): void {
    const saved = localStorage.getItem('bookmarkedArticles');
    if (saved) {
      this.bookmarkedArticles = new Set(JSON.parse(saved));
    }
  }

  shareArticle(article: Article): void {
    if (navigator.share) {
      navigator.share({
        title: article.title,
        text: article.summary || this.getPreview(article.content),
        url: `${window.location.origin}/articles/${article._id}`
      });
    } else {
      // Fallback: copy to clipboard
      const url = `${window.location.origin}/articles/${article._id}`;
      navigator.clipboard.writeText(url).then(() => {
        // You could show a toast notification here
        console.log('Article URL copied to clipboard');
      });
    }
  }

  getAuthorName(author: any): string {
    return typeof author === 'string' ? author : author?.username || 'Unknown';
  }

  getAuthorInitial(author: any): string {
    const name = this.getAuthorName(author);
    return name.charAt(0).toUpperCase();
  }

  getPreview(content: string): string {
    if (!content) return '';
    const plainText = content.replace(/<[^>]*>/g, '');
    return plainText.length > 150 ? plainText.substring(0, 150) + '...' : plainText;
  }

  getReadingTime(content: string): number {
    if (!content) return 1;
    const words = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
    return Math.max(1, Math.ceil(words / 200)); // Assuming 200 words per minute
  }

  formatDate(date: string | Date): string {
    const now = new Date();
    const articleDate = new Date(date);
    const diffTime = Math.abs(now.getTime() - articleDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return articleDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  }
}