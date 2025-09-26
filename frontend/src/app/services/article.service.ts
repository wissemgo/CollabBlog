/**
 * Article Service
 * Handles all article-related API operations
 */

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { 
  Article, 
  ApiResponse, 
  CreateArticleRequest, 
  UpdateArticleRequest,
  ArticleFilters,
  ArticleStatus 
} from '../models';
import { AuthService } from './auth.service';

import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ArticleService {
  private readonly API_URL = `${environment.apiUrl}/articles`;
  
  // Subject to track article updates
  private articlesUpdatedSubject = new BehaviorSubject<boolean>(false);
  public articlesUpdated$ = this.articlesUpdatedSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  /**
   * Get all articles with filters and pagination
   */
  getArticles(filters: ArticleFilters = {}): Observable<{
    articles: Article[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    let params = new HttpParams();
    
    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.limit) params = params.set('limit', filters.limit.toString());
    if (filters.search) params = params.set('search', filters.search);
    if (filters.category) params = params.set('category', filters.category);
    if (filters.author) params = params.set('author', filters.author);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.tags && filters.tags.length > 0) {
      filters.tags.forEach(tag => {
        params = params.append('tags', tag);
      });
    }
    if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
    if (filters.sortOrder) params = params.set('sortOrder', filters.sortOrder);

    return this.http.get<ApiResponse<{
      articles: Article[];
      pagination: any;
    }>>(this.API_URL, { params }).pipe(
      map(response => {
        if (response.success && response.data) {
          return {
            articles: response.data.articles,
            pagination: response.data.pagination
          };
        }
        throw new Error(response.message || 'Failed to fetch articles');
      })
    );
  }

  /**
   * Get article by ID
   */
  getArticleById(id: string): Observable<Article> {
    return this.http.get<ApiResponse<{ article: Article }>>(`${this.API_URL}/${id}`).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data.article;
        }
        throw new Error(response.message || 'Failed to fetch article');
      })
    );
  }

  /**
   * Create new article
   */
  createArticle(articleData: CreateArticleRequest): Observable<Article> {
    return this.http.post<ApiResponse<{ article: Article }>>(this.API_URL, articleData, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      map(response => {
        if (response.success && response.data) {
          this.articlesUpdatedSubject.next(true);
          return response.data.article;
        }
        throw new Error(response.message || 'Failed to create article');
      })
    );
  }

  /**
   * Update article
   */
  updateArticle(id: string, articleData: Partial<CreateArticleRequest>): Observable<Article> {
    return this.http.put<ApiResponse<{ article: Article }>>(`${this.API_URL}/${id}`, articleData, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      map(response => {
        if (response.success && response.data) {
          this.articlesUpdatedSubject.next(true);
          return response.data.article;
        }
        throw new Error(response.message || 'Failed to update article');
      })
    );
  }

  /**
   * Delete article
   */
  deleteArticle(id: string): Observable<void> {
    return this.http.delete<ApiResponse>(`${this.API_URL}/${id}`, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      map(response => {
        if (response.success) {
          this.articlesUpdatedSubject.next(true);
          return;
        }
        throw new Error(response.message || 'Failed to delete article');
      })
    );
  }

  /**
   * Like/Unlike article
   */
  toggleLike(id: string): Observable<{ liked: boolean; likesCount: number }> {
    return this.http.post<ApiResponse<{ liked: boolean; likesCount: number }>>(
      `${this.API_URL}/${id}/like`, 
      {}, 
      { headers: this.authService.getAuthHeaders() }
    ).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.message || 'Failed to toggle like');
      })
    );
  }

  /**
   * Publish article
   */
  publishArticle(id: string): Observable<Article> {
    return this.updateArticle(id, { status: ArticleStatus.PUBLISHED });
  }

  /**
   * Unpublish article
   */
  unpublishArticle(id: string): Observable<Article> {
    return this.updateArticle(id, { status: ArticleStatus.DRAFT });
  }

  /**
   * Get user's articles
   */
  getMyArticles(filters: ArticleFilters = {}): Observable<{
    articles: Article[];
    pagination: any;
  }> {
    const user = this.authService.currentUserValue;
    if (!user) {
      throw new Error('User not authenticated');
    }

    return this.getArticles({
      ...filters,
      author: user._id
    });
  }

  /**
   * Get popular articles
   */
  getPopularArticles(limit = 10): Observable<Article[]> {
    let params = new HttpParams()
      .set('limit', limit.toString())
      .set('sortBy', 'views')
      .set('sortOrder', 'desc');

    return this.http.get<ApiResponse<{ articles: Article[] }>>(
      `${this.API_URL}/popular`, 
      { params }
    ).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data.articles;
        }
        throw new Error(response.message || 'Failed to fetch popular articles');
      })
    );
  }

  /**
   * Get recent articles
   */
  getRecentArticles(limit = 10): Observable<Article[]> {
    let params = new HttpParams()
      .set('limit', limit.toString())
      .set('sortBy', 'publishedAt')
      .set('sortOrder', 'desc');

    return this.http.get<ApiResponse<{ articles: Article[] }>>(
      `${this.API_URL}/recent`, 
      { params }
    ).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data.articles;
        }
        throw new Error(response.message || 'Failed to fetch recent articles');
      })
    );
  }

  /**
   * Search articles
   */
  searchArticles(query: string, filters: Partial<ArticleFilters> = {}): Observable<Article[]> {
    return this.getArticles({
      ...filters,
      search: query
    }).pipe(
      map(result => result.articles)
    );
  }

  /**
   * Get article categories
   */
  getCategories(): Observable<string[]> {
    return this.http.get<ApiResponse<{ categories: string[] }>>(
      `${this.API_URL}/categories`
    ).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data.categories;
        }
        return [];
      })
    );
  }

  /**
   * Get article tags
   */
  getTags(): Observable<string[]> {
    return this.http.get<ApiResponse<{ tags: string[] }>>(
      `${this.API_URL}/tags`
    ).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data.tags;
        }
        return [];
      })
    );
  }

  /**
   * Check if user can edit article
   */
  canEditArticle(article: Article): boolean {
    const user = this.authService.currentUserValue;
    if (!user) return false;

    return this.authService.canEdit(
      typeof article.author === 'string' ? article.author : article.author._id
    );
  }

  /**
   * Check if user can delete article
   */
  canDeleteArticle(article: Article): boolean {
    const user = this.authService.currentUserValue;
    if (!user) return false;

    return this.authService.canDelete(
      typeof article.author === 'string' ? article.author : article.author._id
    );
  }
}