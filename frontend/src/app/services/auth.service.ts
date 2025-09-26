/**
 * Authentication Service
 * Implements JWT + Refresh Token authentication as per requirements
 */

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, timer } from 'rxjs';
import { map, catchError, switchMap, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { 
  User, 
  ApiResponse, 
  AuthResponse, 
  LoginRequest, 
  RegisterRequest, 
  ChangePasswordRequest,
  UpdateProfileRequest,
  UserRole 
} from '../models';

import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = environment.apiUrl;
  private readonly TOKEN_KEY = 'collab_blog_token';
  private readonly REFRESH_TOKEN_KEY = 'collab_blog_refresh_token';
  private readonly USER_KEY = 'collab_blog_user';

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  private tokenRefreshTimer: any;

  public currentUser$ = this.currentUserSubject.asObservable();
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.initializeAuth();
  }

  /**
   * Initialize authentication state on app start
   */
  private initializeAuth(): void {
    const token = this.getToken();
    const user = this.getStoredUser();

    if (token && user && !this.isTokenExpired(token)) {
      this.currentUserSubject.next(user);
      this.isAuthenticatedSubject.next(true);
      this.scheduleTokenRefresh();
    } else {
      this.clearStorage();
    }
  }

  /**
   * Register a new user
   */
  register(registerData: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.API_URL}/auth/register`, registerData)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            this.handleAuthSuccess(response.data);
            return response.data;
          }
          throw new Error(response.message || 'Registration failed');
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Login user
   */
  login(loginData: LoginRequest): Observable<AuthResponse> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.API_URL}/auth/login`, loginData)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            this.handleAuthSuccess(response.data);
            return response.data;
          }
          throw new Error(response.message || 'Login failed');
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Logout user
   */
  logout(): Observable<any> {
    const token = this.getToken();
    
    if (token) {
      return this.http.post<ApiResponse>(`${this.API_URL}/auth/logout`, {}, {
        headers: this.getAuthHeaders()
      }).pipe(
        tap(() => this.handleLogout()),
        catchError(() => {
          // Even if logout fails, clear local storage
          this.handleLogout();
          return throwError('Logout failed');
        })
      );
    }

    this.handleLogout();
    return new Observable(subscriber => subscriber.next(true));
  }

  /**
   * Refresh access token using refresh token
   */
  refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.getRefreshToken();
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    return this.http.post<ApiResponse<AuthResponse>>(`${this.API_URL}/auth/refresh`, {
      refreshToken
    }).pipe(
      map(response => {
        if (response.success && response.data) {
          this.handleAuthSuccess(response.data);
          return response.data;
        }
        throw new Error(response.message || 'Token refresh failed');
      }),
      catchError(error => {
        this.handleLogout();
        return throwError(error);
      })
    );
  }

  /**
   * Get current user profile
   */
  getCurrentUser(): Observable<User> {
    return this.http.get<ApiResponse<{ user: User }>>(`${this.API_URL}/auth/me`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        if (response.success && response.data) {
          const user = response.data.user;
          this.currentUserSubject.next(user);
          this.setStoredUser(user);
          return user;
        }
        throw new Error(response.message || 'Failed to get user profile');
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Update user profile
   */
  updateProfile(profileData: UpdateProfileRequest): Observable<User> {
    return this.http.put<ApiResponse<{ user: User }>>(`${this.API_URL}/users/profile`, profileData, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        if (response.success && response.data) {
          const user = response.data.user;
          this.currentUserSubject.next(user);
          this.setStoredUser(user);
          return user;
        }
        throw new Error(response.message || 'Failed to update profile');
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Change password
   */
  changePassword(passwordData: ChangePasswordRequest): Observable<any> {
    return this.http.put<ApiResponse>(`${this.API_URL}/auth/change-password`, passwordData, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        if (response.success) {
          return response;
        }
        throw new Error(response.message || 'Failed to change password');
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Check if user has required role
   */
  hasRole(requiredRole: UserRole): boolean {
    const user = this.currentUserSubject.value;
    if (!user) return false;

    const roleHierarchy = {
      [UserRole.READER]: 1,
      [UserRole.WRITER]: 2,
      [UserRole.EDITOR]: 3,
      [UserRole.ADMIN]: 4
    };

    return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
  }

  /**
   * Check if user can edit resource
   */
  canEdit(resourceOwnerId: string): boolean {
    const user = this.currentUserSubject.value;
    if (!user) return false;

    return user.role === UserRole.ADMIN || 
           user.role === UserRole.EDITOR || 
           user._id === resourceOwnerId;
  }

  /**
   * Check if user can delete resource
   */
  canDelete(resourceOwnerId: string): boolean {
    const user = this.currentUserSubject.value;
    if (!user) return false;

    return user.role === UserRole.ADMIN || user._id === resourceOwnerId;
  }

  /**
   * Get authentication headers
   */
  getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * Get stored token
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Get stored refresh token
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  /**
   * Get current user value
   */
  get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Check if user is authenticated
   */
  get isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  /**
   * Handle successful authentication
   */
  private handleAuthSuccess(authResponse: AuthResponse): void {
    this.setToken(authResponse.token);
    this.setRefreshToken(authResponse.refreshToken);
    this.setStoredUser(authResponse.user);
    
    this.currentUserSubject.next(authResponse.user);
    this.isAuthenticatedSubject.next(true);
    
    this.scheduleTokenRefresh();
  }

  /**
   * Handle logout
   */
  private handleLogout(): void {
    this.clearStorage();
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    this.clearTokenRefreshTimer();
    this.router.navigate(['/login']);
  }

  /**
   * Schedule automatic token refresh
   */
  private scheduleTokenRefresh(): void {
    const token = this.getToken();
    if (!token) return;

    const tokenExpiry = this.getTokenExpiry(token);
    if (!tokenExpiry) return;

    // Refresh token 5 minutes before expiry
    const refreshTime = tokenExpiry.getTime() - Date.now() - (5 * 60 * 1000);
    
    if (refreshTime > 0) {
      this.tokenRefreshTimer = timer(refreshTime).subscribe(() => {
        this.refreshToken().subscribe({
          error: () => this.handleLogout()
        });
      });
    }
  }

  /**
   * Clear token refresh timer
   */
  private clearTokenRefreshTimer(): void {
    if (this.tokenRefreshTimer) {
      this.tokenRefreshTimer.unsubscribe();
      this.tokenRefreshTimer = null;
    }
  }

  /**
   * Check if token is expired
   */
  private isTokenExpired(token: string): boolean {
    const expiry = this.getTokenExpiry(token);
    return expiry ? expiry.getTime() <= Date.now() : true;
  }

  /**
   * Get token expiry date
   */
  private getTokenExpiry(token: string): Date | null {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp ? new Date(payload.exp * 1000) : null;
    } catch {
      return null;
    }
  }

  /**
   * Storage methods
   */
  private setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  private setRefreshToken(refreshToken: string): void {
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
  }

  private setStoredUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  private getStoredUser(): User | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  private clearStorage(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  /**
   * Handle HTTP errors
   */
  private handleError = (error: any): Observable<never> => {
    let errorMessage = 'An unknown error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else {
      // Server-side error
      if (error.error && error.error.message) {
        errorMessage = error.error.message;
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.status) {
        switch (error.status) {
          case 401:
            errorMessage = 'Invalid credentials or session expired';
            this.handleLogout();
            break;
          case 403:
            errorMessage = 'Access denied';
            break;
          case 404:
            errorMessage = 'Resource not found';
            break;
          case 500:
            errorMessage = 'Internal server error';
            break;
          default:
            errorMessage = `Error ${error.status}: ${error.statusText}`;
        }
      }
    }

    console.error('Auth Service Error:', error);
    return throwError(errorMessage);
  };
}