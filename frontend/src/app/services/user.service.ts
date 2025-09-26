import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ApiResponse, User, UserRole } from '../models';

export interface AdminUser extends User {
  isActive: boolean;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  role?: UserRole;
  isActive?: boolean;
  bio?: string;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  adminUsers: number;
  newUsersThisMonth: number;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly API_URL = `${environment.apiUrl}/admin/users`;

  constructor(private http: HttpClient) {}

  /**
   * Get all users (admin only)
   */
  getAllUsers(params: any = {}): Observable<{ users: AdminUser[], pagination: any }> {
    return this.http.get<ApiResponse<{ users: AdminUser[], pagination: any }>>(`${this.API_URL}`, { params })
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data;
          }
          throw new Error(response.message || 'Failed to fetch users');
        })
      );
  }

  /**
   * Get user statistics
   */
  getUserStats(): Observable<UserStats> {
    return this.http.get<ApiResponse<UserStats>>(`${this.API_URL}/stats`)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data;
          }
          throw new Error(response.message || 'Failed to fetch user stats');
        })
      );
  }

  /**
   * Create a new user (admin only)
   */
  createUser(userData: CreateUserRequest): Observable<AdminUser> {
    return this.http.post<ApiResponse<AdminUser>>(`${this.API_URL}`, userData)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data;
          }
          throw new Error(response.message || 'Failed to create user');
        })
      );
  }

  /**
   * Update user (admin only)
   */
  updateUser(userId: string, userData: UpdateUserRequest): Observable<AdminUser> {
    return this.http.put<ApiResponse<AdminUser>>(`${this.API_URL}/${userId}`, userData)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data;
          }
          throw new Error(response.message || 'Failed to update user');
        })
      );
  }

  /**
   * Update user status (admin only)
   */
  updateUserStatus(userId: string, isActive: boolean): Observable<AdminUser> {
    return this.http.put<ApiResponse<AdminUser>>(`${this.API_URL}/${userId}/status`, { isActive })
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data;
          }
          throw new Error(response.message || 'Failed to update user status');
        })
      );
  }

  /**
   * Delete user (admin only)
   */
  deleteUser(userId: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.API_URL}/${userId}`)
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error(response.message || 'Failed to delete user');
          }
        })
      );
  }

  /**
   * Toggle user active status
   */
  toggleUserStatus(userId: string): Observable<AdminUser> {
    // Since we don't have a direct toggle endpoint, we'll implement this by calling the status update endpoint
    return this.http.put<ApiResponse<AdminUser>>(`${this.API_URL}/${userId}/status`, { isActive: true })
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data;
          }
          throw new Error(response.message || 'Failed to toggle user status');
        })
      );
  }

  /**
   * Update user role
   */
  updateUserRole(userId: string, role: UserRole): Observable<AdminUser> {
    return this.http.put<ApiResponse<AdminUser>>(`${this.API_URL}/${userId}/role`, { role })
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data;
          }
          throw new Error(response.message || 'Failed to update user role');
        })
      );
  }

  /**
   * Search users
   */
  searchUsers(query: string, role?: UserRole): Observable<{ users: AdminUser[], pagination: any }> {
    const params: any = { search: query };
    if (role) {
      params.role = role;
    }

    return this.http.get<ApiResponse<{ users: AdminUser[], pagination: any }>>(`${this.API_URL}`, { params })
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data;
          }
          throw new Error(response.message || 'Failed to search users');
        })
      );
  }

  /**
   * Get users by role
   */
  getUsersByRole(role: UserRole): Observable<{ users: AdminUser[], pagination: any }> {
    return this.http.get<ApiResponse<{ users: AdminUser[], pagination: any }>>(`${this.API_URL}`, { params: { role } })
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data;
          }
          throw new Error(response.message || 'Failed to fetch users by role');
        })
      );
  }

  /**
   * Bulk update users - not implemented in backend yet
   */
  bulkUpdateUsers(userIds: string[], updates: Partial<UpdateUserRequest>): Observable<AdminUser[]> {
    // This endpoint is not implemented in the backend yet
    throw new Error('Bulk update users is not implemented');
  }

  /**
   * Export users data - not implemented in backend yet
   */
  exportUsers(format: 'csv' | 'xlsx' = 'csv'): Observable<Blob> {
    // This endpoint is not implemented in the backend yet
    throw new Error('Export users is not implemented');
  }
}