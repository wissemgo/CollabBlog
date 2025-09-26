import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { RoleGuard } from './guards/role.guard';
import { UserRole } from './models';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    loadComponent: () => import('./components/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'articles',
    loadComponent: () => import('./components/articles/article-list.component').then(m => m.ArticleListComponent)
  },
  {
    path: 'articles/create',
    loadComponent: () => import('./components/articles/article-editor.component').then(m => m.ArticleEditorComponent)
  },
  {
    path: 'articles/:id',
    loadComponent: () => import('./components/articles/article-detail.component').then(m => m.ArticleDetailComponent)
  },
  {
    path: 'auth/login',
    loadComponent: () => import('./components/auth/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'auth/register',
    loadComponent: () => import('./components/auth/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'profile',
    loadComponent: () => import('./components/profile/profile.component').then(m => m.ProfileComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'admin',
    loadComponent: () => import('./components/admin/admin-dashboard.component').then(m => m.AdminDashboardComponent),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: [UserRole.ADMIN] }
  },
  {
    path: 'admin/users',
    loadComponent: () => import('./components/admin/user-management.component').then(m => m.UserManagementComponent),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: [UserRole.ADMIN] }
  },
  {
    path: 'analytics',
    loadComponent: () => import('./components/analytics/analytics-dashboard.component').then(m => m.AnalyticsDashboardComponent),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.EDITOR] }
  },
  {
    path: '**',
    redirectTo: '/home'
  }
];
