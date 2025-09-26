import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { Subject, takeUntil } from 'rxjs';
import { UserRole } from '../../models';

interface User {
  _id: string;
  username: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
  lastLogin?: Date;
  stats?: {
    articles: number;
    comments: number;
  };
}

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="user-management-container">
      <div class="management-header">
        <h2>User Management</h2>
        <div class="header-actions">
          <div class="search-box">
            <input 
              type="text" 
              placeholder="Search users..." 
              [(ngModel)]="searchTerm"
              (input)="loadUsers()"
              class="search-input">
          </div>
          <button class="btn-primary" (click)="openCreateUserModal()">
            Add User
          </button>
        </div>
      </div>

      <div class="filters-section">
        <div class="filter-group">
          <label>Role:</label>
          <select [(ngModel)]="roleFilter" (change)="loadUsers()" class="filter-select">
            <option value="">All Roles</option>
            <option *ngFor="let role of userRoles" [value]="role.value">{{role.label}}</option>
          </select>
        </div>
        <div class="filter-group">
          <label>Status:</label>
          <select [(ngModel)]="statusFilter" (change)="loadUsers()" class="filter-select">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div class="stats-summary">
          <span class="stat">Total: {{totalUsers}}</span>
          <span class="stat">Active: {{activeUsers}}</span>
        </div>
      </div>

      <div class="table-container">
        <table class="users-table">
          <thead>
            <tr>
              <th (click)="sortBy('username')" class="sortable">Username</th>
              <th (click)="sortBy('email')" class="sortable">Email</th>
              <th (click)="sortBy('role')" class="sortable">Role</th>
              <th>Status</th>
              <th (click)="sortBy('createdAt')" class="sortable">Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let user of filteredUsers" [class.inactive]="!user.isActive">
              <td>
                <div class="user-info">
                  <div class="avatar">{{user.username.charAt(0).toUpperCase()}}</div>
                  <span>{{user.username}}</span>
                </div>
              </td>
              <td>{{user.email}}</td>
              <td>
                <span class="role-badge" [class]="'role-' + user.role.toLowerCase()">
                  {{getRoleLabel(user.role)}}
                </span>
              </td>
              <td>
                <span class="status-badge" [class.active]="user.isActive" [class.inactive]="!user.isActive">
                  {{user.isActive ? 'Active' : 'Inactive'}}
                </span>
              </td>
              <td>{{formatDate(user.createdAt)}}</td>
              <td>
                <div class="action-buttons">
                  <button class="btn-icon edit" (click)="editUser(user)" title="Edit">✏️</button>
                  <button class="btn-icon toggle" (click)="toggleUserStatus(user)" 
                          [title]="user.isActive ? 'Deactivate' : 'Activate'">
                    {{user.isActive ? '🔒' : '🔓'}}
                  </button>
                  <button class="btn-icon delete" (click)="deleteUser(user)" title="Delete"
                          [disabled]="user.role === 'ADMIN'">🗑️</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        
        <div *ngIf="filteredUsers.length === 0" class="no-users">
          <p>No users found matching your criteria.</p>
        </div>
      </div>
    </div>

    <!-- User Modal -->
    <div class="modal-overlay" *ngIf="showUserModal" (click)="closeUserModal()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>{{isEditMode ? 'Edit User' : 'Create User'}}</h3>
          <button class="modal-close" (click)="closeUserModal()">×</button>
        </div>
        
        <form [formGroup]="userForm" (ngSubmit)="saveUser()" class="user-form">
          <div class="form-group">
            <label for="username">Username *</label>
            <input type="text" id="username" formControlName="username" class="form-input">
            <div class="error-message" *ngIf="userForm.get('username')?.invalid && userForm.get('username')?.touched">
              Username is required and must be at least 3 characters
            </div>
          </div>

          <div class="form-group">
            <label for="email">Email *</label>
            <input type="email" id="email" formControlName="email" class="form-input">
            <div class="error-message" *ngIf="userForm.get('email')?.invalid && userForm.get('email')?.touched">
              Please enter a valid email address
            </div>
          </div>

          <div class="form-group" *ngIf="!isEditMode">
            <label for="password">Password *</label>
            <input type="password" id="password" formControlName="password" class="form-input">
            <div class="error-message" *ngIf="userForm.get('password')?.invalid && userForm.get('password')?.touched">
              Password must be at least 6 characters
            </div>
          </div>

          <div class="form-group">
            <label for="role">Role *</label>
            <select id="role" formControlName="role" class="form-select">
              <option value="">Select Role</option>
              <option *ngFor="let role of userRoles" [value]="role.value">{{role.label}}</option>
            </select>
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" formControlName="isActive" class="form-checkbox">
              Active User
            </label>
          </div>

          <div class="form-actions">
            <button type="button" class="btn-secondary" (click)="closeUserModal()">Cancel</button>
            <button type="submit" class="btn-primary" [disabled]="userForm.invalid || isLoading">
              {{isLoading ? 'Saving...' : (isEditMode ? 'Update User' : 'Create User')}}
            </button>
          </div>
        </form>
      </div>
    </div>

    <div class="loading-overlay" *ngIf="isLoading">
      <div class="spinner"></div>
    </div>
  `,
  styles: [`
    .user-management-container {
      padding: 2rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      color: white;
    }

    .management-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      background: rgba(255, 255, 255, 0.1);
      padding: 1.5rem;
      border-radius: 15px;
      backdrop-filter: blur(10px);
    }

    .header-actions {
      display: flex;
      gap: 1rem;
      align-items: center;
    }

    .search-input {
      padding: 0.75rem;
      border: none;
      border-radius: 25px;
      background: rgba(255, 255, 255, 0.9);
      color: #333;
      width: 250px;
    }

    .filters-section {
      display: flex;
      gap: 2rem;
      align-items: center;
      margin-bottom: 2rem;
      background: rgba(255, 255, 255, 0.1);
      padding: 1rem 1.5rem;
      border-radius: 15px;
    }

    .filter-group {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .filter-select {
      padding: 0.5rem;
      border: none;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.9);
      color: #333;
    }

    .stats-summary {
      margin-left: auto;
      display: flex;
      gap: 1rem;
    }

    .stat {
      padding: 0.5rem 1rem;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 20px;
      font-weight: 500;
    }

    .table-container {
      background: rgba(255, 255, 255, 0.95);
      border-radius: 15px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    }

    .users-table {
      width: 100%;
      border-collapse: collapse;
      color: #333;
    }

    .users-table th {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 1rem;
      text-align: left;
      font-weight: 600;
      cursor: pointer;
    }

    .users-table td {
      padding: 1rem;
      border-bottom: 1px solid #eee;
    }

    .users-table tr:hover {
      background-color: #f8f9ff;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
    }

    .role-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 500;
      text-transform: uppercase;
    }

    .role-badge.role-admin { background: #e74c3c; color: white; }
    .role-badge.role-editor { background: #f39c12; color: white; }
    .role-badge.role-writer { background: #3498db; color: white; }
    .role-badge.role-reader { background: #95a5a6; color: white; }

    .status-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 500;
    }

    .status-badge.active { background: #27ae60; color: white; }
    .status-badge.inactive { background: #e74c3c; color: white; }

    .action-buttons {
      display: flex;
      gap: 0.5rem;
    }

    .btn-icon {
      width: 35px;
      height: 35px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
      font-size: 1rem;
    }

    .btn-icon.edit { background: #3498db; color: white; }
    .btn-icon.toggle { background: #f39c12; color: white; }
    .btn-icon.delete { background: #e74c3c; color: white; }
    .btn-icon:disabled { opacity: 0.5; cursor: not-allowed; }

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

    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      border-radius: 15px;
      max-width: 500px;
      width: 90%;
      color: #333;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 15px 15px 0 0;
    }

    .modal-close {
      background: none;
      border: none;
      font-size: 2rem;
      color: white;
      cursor: pointer;
    }

    .user-form {
      padding: 2rem;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
    }

    .form-input, .form-select {
      width: 100%;
      padding: 0.75rem;
      border: 2px solid #ddd;
      border-radius: 8px;
      font-size: 1rem;
    }

    .form-input:focus, .form-select:focus {
      outline: none;
      border-color: #667eea;
    }

    .error-message {
      color: #e74c3c;
      font-size: 0.875rem;
      margin-top: 0.25rem;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      cursor: pointer;
      font-weight: 500;
    }

    .form-actions {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
      margin-top: 2rem;
    }

    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2000;
    }

    .spinner {
      width: 50px;
      height: 50px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .no-users {
      text-align: center;
      padding: 3rem;
      color: #666;
    }
  `]
})
export class UserManagementComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  users: User[] = [];
  filteredUsers: User[] = [];
  userRoles = Object.values(UserRole).map(role => ({
    value: role,
    label: role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()
  }));

  searchTerm = '';
  roleFilter = '';
  statusFilter = '';
  sortField = 'createdAt';
  sortDirection: 'asc' | 'desc' = 'desc';

  totalUsers = 0;
  activeUsers = 0;
  inactiveUsers = 0;

  showUserModal = false;
  isEditMode = false;
  isLoading = false;
  currentUser: User | null = null;
  userForm: FormGroup;

  private userService = inject(UserService);
  
  constructor(private fb: FormBuilder) {
    this.userForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.minLength(6)]],
      role: ['', Validators.required],
      isActive: [true]
    });
  }

  ngOnInit() {
    this.loadUsers();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadUsers() {
    this.isLoading = true;
    const params: any = {
      page: 1, // Implement pagination later
      limit: 100, // Load a large number for now
      search: this.searchTerm,
      role: this.roleFilter,
      status: this.statusFilter,
      sortBy: this.sortField,
      sortOrder: this.sortDirection
    };

    // Remove empty params
    for (const key in params) {
      if (params[key] === '' || params[key] === null) {
        delete params[key];
      }
    }

    this.userService.getAllUsers(params).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        this.users = response.users;
        this.filteredUsers = response.users;
        this.totalUsers = response.pagination.total;
        this.updateStatistics();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.isLoading = false;
      }
    });
  }

  updateStatistics() {
    this.activeUsers = this.users.filter(u => u.isActive).length;
    this.inactiveUsers = this.users.filter(u => !u.isActive).length;
  }

  sortBy(field: string) {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    this.loadUsers();
  }

  getRoleLabel(roleValue: string): string {
    const role = this.userRoles.find(r => r.value.toLowerCase() === roleValue.toLowerCase());
    return role ? role.label : roleValue;
  }

  formatDate(date: Date | string): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString();
  }

  openCreateUserModal() {
    this.isEditMode = false;
    this.currentUser = null;
    this.userForm.reset();
    this.userForm.patchValue({ isActive: true });
    this.showUserModal = true;
  }

  editUser(user: User) {
    this.isEditMode = true;
    this.currentUser = user;
    this.userForm.patchValue({
      username: user.username,
      email: user.email,
      role: user.role,
      isActive: user.isActive
    });
    this.showUserModal = true;
  }

  closeUserModal() {
    this.showUserModal = false;
    this.currentUser = null;
    this.userForm.reset();
  }

  saveUser() {
    if (this.userForm.valid) {
      this.isLoading = true;
      
      const formData = this.userForm.value;
      
      if (this.isEditMode && this.currentUser) {
        // Update existing user
        this.userService.updateUser(this.currentUser._id, formData).pipe(takeUntil(this.destroy$)).subscribe({
          next: () => {
            this.loadUsers();
            this.closeUserModal();
          },
          error: (error) => {
            console.error('Error updating user:', error);
            this.isLoading = false;
          }
        });
      } else {
        // Create new user
        this.userService.createUser(formData).pipe(takeUntil(this.destroy$)).subscribe({
          next: () => {
            this.loadUsers();
            this.closeUserModal();
          },
          error: (error) => {
            console.error('Error creating user:', error);
            this.isLoading = false;
          }
        });
      }
    }
  }

  toggleUserStatus(user: User) {
    this.isLoading = true;
    
    this.userService.toggleUserStatus(user._id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.loadUsers();
      },
      error: (error) => {
        console.error('Error toggling user status:', error);
        this.isLoading = false;
      }
    });
  }

  deleteUser(user: User) {
    if (user.role === 'ADMIN') return;
    
    if (confirm(`Are you sure you want to delete user "${user.username}"?`)) {
      this.isLoading = true;
      
      this.userService.deleteUser(user._id).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => {
          this.loadUsers();
        },
        error: (error) => {
          console.error('Error deleting user:', error);
          this.isLoading = false;
        }
      });
    }
  }
}