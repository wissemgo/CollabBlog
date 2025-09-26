import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { User, UserRole } from '../../models';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';

// Extended interface for admin management
interface AdminUser extends User {
  isActive: boolean;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="admin-dashboard">
      <div class="admin-header">
        <h1>Admin Dashboard</h1>
        <p>Manage users, roles, and system settings</p>
      </div>

      <div class="admin-nav">
        <button 
          class="nav-btn" 
          [class.active]="activeTab === 'users'"
          (click)="setActiveTab('users')">
          <i class="fas fa-users"></i>
          User Management
        </button>
        <button 
          class="nav-btn"
          [class.active]="activeTab === 'roles'" 
          (click)="setActiveTab('roles')">
          <i class="fas fa-user-shield"></i>
          Role Management
        </button>
        <button 
          class="nav-btn"
          [class.active]="activeTab === 'analytics'"
          (click)="setActiveTab('analytics')">
          <i class="fas fa-chart-bar"></i>
          Analytics
        </button>
      </div>

      <div class="admin-content">
        <!-- User Management Tab -->
        <div class="tab-content" *ngIf="activeTab === 'users'">
          <div class="content-header">
            <h2>User Management</h2>
            <button class="btn btn-primary" (click)="showCreateUser()">
              <i class="fas fa-plus"></i> Add New User
            </button>
          </div>

          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon">
                <i class="fas fa-users"></i>
              </div>
              <div class="stat-info">
                <h3>{{ totalUsers }}</h3>
                <p>Total Users</p>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">
                <i class="fas fa-user-check"></i>
              </div>
              <div class="stat-info">
                <h3>{{ activeUsers }}</h3>
                <p>Active Users</p>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">
                <i class="fas fa-crown"></i>
              </div>
              <div class="stat-info">
                <h3>{{ adminUsers }}</h3>
                <p>Administrators</p>
              </div>
            </div>
          </div>

          <div class="users-table">
            <div class="table-header">
              <div class="search-bar">
                <i class="fas fa-search"></i>
                <input 
                  type="text" 
                  placeholder="Search users..."
                  [(ngModel)]="searchTerm"
                  (input)="filterUsers()">
              </div>
              <div class="filter-options">
                <select [(ngModel)]="selectedRole" (change)="filterUsers()">
                  <option value="">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="editor">Editor</option>
                  <option value="writer">Writer</option>
                  <option value="reader">Reader</option>
                </select>
              </div>
            </div>

            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Avatar</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let user of filteredUsers">
                    <td>
                      <div class="avatar">
                        {{ user.username.charAt(0).toUpperCase() }}
                      </div>
                    </td>
                    <td>{{ user.username }}</td>
                    <td>{{ user.email }}</td>
                    <td>
                      <span class="role-badge" [class]="'role-' + user.role">
                        {{ user.role | titlecase }}
                      </span>
                    </td>
                    <td>
                      <span class="status-badge" [class]="user.isActive ? 'status-active' : 'status-inactive'">
                        {{ user.isActive ? 'Active' : 'Inactive' }}
                      </span>
                    </td>
                    <td>{{ formatDate(user.createdAt) }}</td>
                    <td>
                      <div class="action-buttons">
                        <button class="btn-icon btn-edit" (click)="editUser(user)" title="Edit">
                          <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon btn-delete" (click)="deleteUser(user)" title="Delete">
                          <i class="fas fa-trash"></i>
                        </button>
                        <button 
                          class="btn-icon btn-toggle" 
                          (click)="toggleUserStatus(user)"
                          [title]="user.isActive ? 'Deactivate' : 'Activate'">
                          <i class="fas" [class]="user.isActive ? 'fa-user-slash' : 'fa-user-check'"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Role Management Tab -->
        <div class="tab-content" *ngIf="activeTab === 'roles'">
          <div class="content-header">
            <h2>Role Management</h2>
            <p>Configure permissions for different user roles</p>
          </div>

          <div class="roles-grid">
            <div class="role-card" *ngFor="let role of roles">
              <div class="role-header">
                <div class="role-icon" [class]="'role-' + role.name">
                  <i class="fas" [class]="getRoleIcon(role.name)"></i>
                </div>
                <h3>{{ role.name | titlecase }}</h3>
                <p>{{ role.description }}</p>
              </div>
              <div class="role-permissions">
                <h4>Permissions</h4>
                <div class="permissions-list">
                  <div class="permission-item" *ngFor="let permission of role.permissions">
                    <i class="fas fa-check"></i>
                    <span>{{ formatPermission(permission) }}</span>
                  </div>
                </div>
              </div>
              <div class="role-actions">
                <button class="btn btn-outline" (click)="editRole(role)">
                  <i class="fas fa-edit"></i> Edit Permissions
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Analytics Tab -->
        <div class="tab-content" *ngIf="activeTab === 'analytics'">
          <div class="content-header">
            <h2>System Analytics</h2>
            <p>Overview of system usage and statistics</p>
          </div>

          <div class="analytics-grid">
            <div class="analytics-card">
              <h3>User Registration Trends</h3>
              <div class="chart-container">
                <canvas #userRegistrationChart></canvas>
              </div>
            </div>
            <div class="analytics-card">
              <h3>Role Distribution</h3>
              <div class="chart-container">
                <canvas #roleDistributionChart></canvas>
              </div>
            </div>
            <div class="analytics-card full-width">
              <h3>Article Statistics</h3>
              <div class="chart-container">
                <canvas #articleStatsChart></canvas>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit, AfterViewInit {
  @ViewChild('userRegistrationChart', { static: false }) userRegistrationChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('roleDistributionChart', { static: false }) roleDistributionChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('articleStatsChart', { static: false }) articleStatsChart!: ElementRef<HTMLCanvasElement>;
  
  private registrationChart: Chart | null = null;
  private distributionChart: Chart | null = null;
  private articleChart: Chart | null = null;
  activeTab: string = 'users';
  searchTerm: string = '';
  selectedRole: string = '';
  
  // Mock data - in real app, this would come from a service
  totalUsers: number = 0;
  activeUsers: number = 0;
  adminUsers: number = 0;
  
  users: AdminUser[] = [];
  filteredUsers: AdminUser[] = [];
  
  roles = [
    {
      name: 'admin',
      description: 'Full system access with all permissions',
      permissions: ['create:all', 'read:all', 'update:all', 'delete:all', 'manage:users', 'manage:roles']
    },
    {
      name: 'editor',
      description: 'Can manage and publish all articles',
      permissions: ['create:articles', 'read:all', 'update:articles', 'delete:articles', 'moderate:comments']
    },
    {
      name: 'writer',
      description: 'Can create and edit own articles',
      permissions: ['create:own-articles', 'read:all', 'update:own-articles', 'comment:all']
    },
    {
      name: 'reader',
      description: 'Can read articles and comment',
      permissions: ['read:all', 'comment:all']
    }
  ];

  constructor(private authService: AuthService) {
    Chart.register(...registerables);
  }

  ngOnInit() {
    this.loadUsers();
    this.calculateStats();
  }

  ngAfterViewInit() {
    // Initialize charts after view is initialized
    setTimeout(() => {
      this.initializeCharts();
    }, 100);
  }

  private initializeCharts() {
    this.createUserRegistrationChart();
    this.createRoleDistributionChart();
    this.createArticleStatsChart();
  }

  private createUserRegistrationChart() {
    if (this.userRegistrationChart) {
      const ctx = this.userRegistrationChart.nativeElement.getContext('2d');
      if (ctx) {
        this.registrationChart = new Chart(ctx, {
          type: 'line',
          data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
              label: 'New Users',
              data: [5, 12, 19, 8, 15, 25],
              borderColor: '#667eea',
              backgroundColor: 'rgba(102, 126, 234, 0.1)',
              tension: 0.4,
              fill: true
            }]
          },
          options: {
            responsive: true,
            plugins: {
              legend: {
                display: false
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                grid: {
                  color: 'rgba(0,0,0,0.1)'
                }
              },
              x: {
                grid: {
                  display: false
                }
              }
            }
          }
        });
      }
    }
  }

  private createRoleDistributionChart() {
    if (this.roleDistributionChart) {
      const ctx = this.roleDistributionChart.nativeElement.getContext('2d');
      if (ctx) {
        this.distributionChart = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: ['Admin', 'Editor', 'Writer', 'Reader'],
            datasets: [{
              data: [2, 5, 15, 28],
              backgroundColor: [
                '#ff6b6b',
                '#4ecdc4',
                '#45b7d1',
                '#96ceb4'
              ],
              borderWidth: 0
            }]
          },
          options: {
            responsive: true,
            plugins: {
              legend: {
                position: 'bottom',
                labels: {
                  padding: 20,
                  usePointStyle: true
                }
              }
            }
          }
        });
      }
    }
  }

  private createArticleStatsChart() {
    if (this.articleStatsChart) {
      const ctx = this.articleStatsChart.nativeElement.getContext('2d');
      if (ctx) {
        this.articleChart = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: ['Published', 'Draft', 'Pending', 'Archived'],
            datasets: [{
              label: 'Articles',
              data: [45, 12, 8, 5],
              backgroundColor: [
                '#28a745',
                '#ffc107',
                '#17a2b8',
                '#6c757d'
              ],
              borderRadius: 8,
              borderSkipped: false
            }]
          },
          options: {
            responsive: true,
            plugins: {
              legend: {
                display: false
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                grid: {
                  color: 'rgba(0,0,0,0.1)'
                }
              },
              x: {
                grid: {
                  display: false
                }
              }
            }
          }
        });
      }
    }
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }

  loadUsers() {
    // Mock users - in real app, fetch from service
    this.users = [
      {
        _id: '1',
        username: 'admin',
        email: 'admin@example.com',
        role: UserRole.ADMIN,
        isActive: true,
        bio: '',
        isEmailVerified: true,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date()
      },
      {
        _id: '2',
        username: 'editor1',
        email: 'editor@example.com',
        role: UserRole.EDITOR,
        isActive: true,
        bio: '',
        isEmailVerified: true,
        createdAt: new Date('2024-02-10'),
        updatedAt: new Date()
      },
      {
        _id: '3',
        username: 'writer1',
        email: 'writer@example.com',
        role: UserRole.WRITER,
        isActive: true,
        bio: '',
        isEmailVerified: true,
        createdAt: new Date('2024-03-05'),
        updatedAt: new Date()
      }
    ];
    
    this.filteredUsers = [...this.users];
  }

  calculateStats() {
    this.totalUsers = this.users.length;
    this.activeUsers = this.users.filter(u => u.isActive).length;
    this.adminUsers = this.users.filter(u => u.role === UserRole.ADMIN).length;
  }

  filterUsers() {
    this.filteredUsers = this.users.filter(user => {
      const matchesSearch = user.username.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                           user.email.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesRole = !this.selectedRole || user.role === this.selectedRole;
      return matchesSearch && matchesRole;
    });
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString();
  }

  getRoleIcon(role: string): string {
    const icons: { [key: string]: string } = {
      'admin': 'fa-crown',
      'editor': 'fa-user-edit',
      'writer': 'fa-pen',
      'reader': 'fa-user'
    };
    return icons[role] || 'fa-user';
  }

  formatPermission(permission: string): string {
    return permission.replace(/[:_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  showCreateUser() {
    // Implement create user modal
    console.log('Show create user modal');
  }

  editUser(user: AdminUser) {
    // Implement edit user functionality
    console.log('Edit user:', user);
  }

  deleteUser(user: AdminUser) {
    // Implement delete user functionality
    console.log('Delete user:', user);
  }

  toggleUserStatus(user: AdminUser) {
    // Implement toggle user status
    user.isActive = !user.isActive;
    console.log('Toggle user status:', user);
  }

  editRole(role: any) {
    // Implement edit role functionality
    console.log('Edit role:', role);
  }
}