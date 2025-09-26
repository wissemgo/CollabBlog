import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserRole, User } from '../../models';
import { NotificationsComponent } from '../notifications/notifications.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, NotificationsComponent],
  template: `
    <nav class="navbar">
      <div class="nav-container">
        <div class="nav-brand">
          <a routerLink="/home">
            <i class="fas fa-blog"></i>
            <span>CollabBlog</span>
          </a>
        </div>
        
        <div class="nav-menu">
          <a routerLink="/home" routerLinkActive="active" class="nav-link">
            <i class="fas fa-home"></i>
            Home
          </a>
          <a routerLink="/articles" routerLinkActive="active" class="nav-link">
            <i class="fas fa-newspaper"></i>
            Articles
          </a>
          
          <!-- Authenticated User Menu -->
          <ng-container *ngIf="authService.isAuthenticated">
            <a routerLink="/dashboard" routerLinkActive="active" class="nav-link">
              <i class="fas fa-tachometer-alt"></i>
              Dashboard
            </a>
            <a routerLink="/admin" routerLinkActive="active" class="nav-link" *ngIf="isAdmin()">
              <i class="fas fa-cog"></i>
              Admin
            </a>
            <a routerLink="/analytics" routerLinkActive="active" class="nav-link" *ngIf="canViewAnalytics()">
              <i class="fas fa-chart-bar"></i>
              Analytics
            </a>
            
            <app-notifications></app-notifications>
            
            <button (click)="logout()" class="nav-link logout-btn">
              <i class="fas fa-sign-out-alt"></i>
              Logout
            </button>
          </ng-container>
          
          <!-- Guest Menu -->
          <ng-container *ngIf="!authService.isAuthenticated">
            <a routerLink="/auth/login" routerLinkActive="active" class="nav-link">
              <i class="fas fa-sign-in-alt"></i>
              Login
            </a>
            <a routerLink="/auth/register" routerLinkActive="active" class="nav-link nav-link-primary">
              <i class="fas fa-user-plus"></i>
              Sign Up
            </a>
          </ng-container>
        </div>
      </div>
    </nav>
  `,
  // ... existing styles ... (keeping the same styles)
  styles: [`
    .navbar {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
      padding: 1rem 0;
      position: sticky;
      top: 0;
      z-index: 1000;
      box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
    }
    
    .nav-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .nav-brand a {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      text-decoration: none;
      font-size: 1.5rem;
      font-weight: 600;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    .nav-menu {
      display: flex;
      gap: 2rem;
      align-items: center;
    }
    
    .nav-link {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      text-decoration: none;
      color: #555;
      font-weight: 500;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      transition: all 0.3s ease;
      border: none;
      background: transparent;
      cursor: pointer;
      font-size: 1rem;
      font-family: inherit;
    }
    
    .nav-link:hover,
    .nav-link.active {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      transform: translateY(-2px);
    }

    .nav-link-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .nav-link-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }

    .logout-btn {
      background: #dc3545;
      color: white;
    }

    .logout-btn:hover {
      background: #c82333;
    }

    @media (max-width: 768px) {
      .nav-container {
        padding: 0 1rem;
      }
      
      .nav-menu {
        gap: 1rem;
      }
      
      .nav-link {
        padding: 0.5rem;
        font-size: 0.9rem;
      }
    }
  `]
})
export class NavbarComponent {
  constructor(public authService: AuthService) {}
  
  isAdmin(): boolean {
    return this.authService.hasRole(UserRole.ADMIN);
  }

  canViewAnalytics(): boolean {
    return this.authService.hasRole(UserRole.ADMIN) || this.authService.hasRole(UserRole.EDITOR);
  }

  logout(): void {
    this.authService.logout().subscribe();
  }
}