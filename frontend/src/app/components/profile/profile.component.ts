import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { User, UserRole } from '../../models';
// import { PushSettingsComponent } from '../notifications/push-settings.component'; // Temporarily disabled

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="profile-container">
      <div class="profile-header">
        <div class="header-content">
          <div class="avatar-section">
            <img 
              [src]="currentUser?.avatar || '/assets/default-avatar.png'" 
              [alt]="currentUser?.username"
              class="profile-avatar"
              (error)="onImageError($event)"
            >
            <button class="change-avatar-btn" (click)="changeAvatar()">
              <i class="fas fa-camera"></i>
              Change Photo
            </button>
          </div>
          
          <div class="user-info">
            <h1>{{ currentUser?.username }}</h1>
            <p class="user-email">{{ currentUser?.email }}</p>
            <span class="role-badge" [class]="getRoleClass()">
              <i [class]="getRoleIcon()"></i>
              {{ getRoleDisplayName() }}
            </span>
          </div>
        </div>
        
        <div class="header-actions">
          <button routerLink="/dashboard" class="btn btn-secondary">
            <i class="fas fa-tachometer-alt"></i>
            Dashboard
          </button>
        </div>
      </div>

      <div class="profile-content">
        <div class="profile-tabs">
          <button 
            class="tab-btn" 
            [class.active]="activeTab === 'profile'"
            (click)="setActiveTab('profile')"
          >
            <i class="fas fa-user"></i>
            Profile Settings
          </button>
          <button 
            class="tab-btn" 
            [class.active]="activeTab === 'security'"
            (click)="setActiveTab('security')"
          >
            <i class="fas fa-shield-alt"></i>
            Security
          </button>
          <button 
            class="tab-btn" 
            [class.active]="activeTab === 'preferences'"
            (click)="setActiveTab('preferences')"
          >
            <i class="fas fa-cog"></i>
            Preferences
          </button>
        </div>

        <!-- Profile Settings Tab -->
        <div class="tab-content" *ngIf="activeTab === 'profile'">
          <div class="settings-section">
            <h2>Profile Information</h2>
            <p>Update your account's profile information and bio.</p>
            
            <form [formGroup]="profileForm" (ngSubmit)="updateProfile()" class="profile-form">
              <div class="form-row">
                <div class="form-group">
                  <label for="username">Username</label>
                  <input
                    type="text"
                    id="username"
                    formControlName="username"
                    class="form-input"
                    [class.error]="isFieldInvalid('username')"
                  >
                  <div class="error-message" *ngIf="isFieldInvalid('username')">
                    <span *ngIf="profileForm.get('username')?.errors?.['required']">Username is required</span>
                    <span *ngIf="profileForm.get('username')?.errors?.['minlength']">Username must be at least 3 characters</span>
                  </div>
                </div>

                <div class="form-group">
                  <label for="email">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    formControlName="email"
                    class="form-input"
                    [class.error]="isFieldInvalid('email')"
                  >
                  <div class="error-message" *ngIf="isFieldInvalid('email')">
                    <span *ngIf="profileForm.get('email')?.errors?.['required']">Email is required</span>
                    <span *ngIf="profileForm.get('email')?.errors?.['email']">Please enter a valid email</span>
                  </div>
                </div>
              </div>

              <div class="form-group">
                <label for="bio">Bio</label>
                <textarea
                  id="bio"
                  formControlName="bio"
                  class="form-textarea"
                  rows="4"
                  placeholder="Tell us about yourself..."
                ></textarea>
                <div class="char-count">{{ getBioLength() }}/500 characters</div>
              </div>

              <div class="form-group">
                <label for="avatar">Avatar URL</label>
                <input
                  type="url"
                  id="avatar"
                  formControlName="avatar"
                  class="form-input"
                  placeholder="https://example.com/avatar.jpg"
                  [class.error]="isFieldInvalid('avatar')"
                >
                <div class="error-message" *ngIf="isFieldInvalid('avatar')">
                  <span *ngIf="profileForm.get('avatar')?.errors?.['url']">Please enter a valid URL</span>
                </div>
              </div>

              <div class="form-actions">
                <button 
                  type="submit" 
                  class="btn btn-primary"
                  [disabled]="profileForm.invalid || isUpdatingProfile"
                >
                  <span *ngIf="isUpdatingProfile" class="loading-spinner"></span>
                  {{ isUpdatingProfile ? 'Updating...' : 'Update Profile' }}
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- Security Tab -->
        <div class="tab-content" *ngIf="activeTab === 'security'">
          <div class="settings-section">
            <h2>Change Password</h2>
            <p>Ensure your account is using a long, random password to stay secure.</p>
            
            <form [formGroup]="passwordForm" (ngSubmit)="changePassword()" class="password-form">
              <div class="form-group">
                <label for="currentPassword">Current Password</label>
                <input
                  type="password"
                  id="currentPassword"
                  formControlName="currentPassword"
                  class="form-input"
                  [class.error]="isPasswordFieldInvalid('currentPassword')"
                >
                <div class="error-message" *ngIf="isPasswordFieldInvalid('currentPassword')">
                  <span *ngIf="passwordForm.get('currentPassword')?.errors?.['required']">Current password is required</span>
                </div>
              </div>

              <div class="form-group">
                <label for="newPassword">New Password</label>
                <input
                  type="password"
                  id="newPassword"
                  formControlName="newPassword"
                  class="form-input"
                  [class.error]="isPasswordFieldInvalid('newPassword')"
                >
                <div class="error-message" *ngIf="isPasswordFieldInvalid('newPassword')">
                  <span *ngIf="passwordForm.get('newPassword')?.errors?.['required']">New password is required</span>
                  <span *ngIf="passwordForm.get('newPassword')?.errors?.['minlength']">Password must be at least 8 characters</span>
                </div>
              </div>

              <div class="form-group">
                <label for="confirmPassword">Confirm New Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  formControlName="confirmPassword"
                  class="form-input"
                  [class.error]="isPasswordFieldInvalid('confirmPassword') || passwordForm.errors?.['passwordMismatch']"
                >
                <div class="error-message" *ngIf="isPasswordFieldInvalid('confirmPassword') || passwordForm.errors?.['passwordMismatch']">
                  <span *ngIf="passwordForm.get('confirmPassword')?.errors?.['required']">Please confirm your new password</span>
                  <span *ngIf="passwordForm.errors?.['passwordMismatch']">Passwords do not match</span>
                </div>
              </div>

              <div class="form-actions">
                <button 
                  type="submit" 
                  class="btn btn-primary"
                  [disabled]="passwordForm.invalid || isChangingPassword"
                >
                  <span *ngIf="isChangingPassword" class="loading-spinner"></span>
                  {{ isChangingPassword ? 'Changing...' : 'Change Password' }}
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- Preferences Tab -->
        <div class="tab-content" *ngIf="activeTab === 'preferences'">
          <div class="settings-section">
            <h2>Account Preferences</h2>
            <p>Manage your account preferences and notification settings.</p>
            
            <form [formGroup]="preferencesForm" class="preferences-form">
              <div class="preference-group">
                <h3>Email Notifications</h3>
                
                <div class="checkbox-group">
                  <label class="checkbox-label">
                    <input type="checkbox" formControlName="emailOnNewComment">
                    <span class="checkmark"></span>
                    Email me when someone comments on my articles
                  </label>
                </div>
                
                <div class="checkbox-group">
                  <label class="checkbox-label">
                    <input type="checkbox" formControlName="emailOnNewFollower">
                    <span class="checkmark"></span>
                    Email me when someone follows me
                  </label>
                </div>
                
                <div class="checkbox-group">
                  <label class="checkbox-label">
                    <input type="checkbox" formControlName="emailDigest">
                    <span class="checkmark"></span>
                    Send me weekly digest of new articles
                  </label>
                </div>
              </div>

              <div class="preference-group">
                <h3>Privacy Settings</h3>
                
                <div class="checkbox-group">
                  <label class="checkbox-label">
                    <input type="checkbox" formControlName="profilePublic">
                    <span class="checkmark"></span>
                    Make my profile public
                  </label>
                </div>
                
                <div class="checkbox-group">
                  <label class="checkbox-label">
                    <input type="checkbox" formControlName="showEmail">
                    <span class="checkmark"></span>
                    Show my email on public profile
                  </label>
                </div>
              </div>

              <div class="form-actions">
                <button 
                  type="button"
                  (click)="updatePreferences()" 
                  class="btn btn-primary"
                  [disabled]="isUpdatingPreferences"
                >
                  <span *ngIf="isUpdatingPreferences" class="loading-spinner"></span>
                  {{ isUpdatingPreferences ? 'Saving...' : 'Save Preferences' }}
                </button>
              </div>
            </form>
          </div>

          <!-- Push Notifications Section (temporarily disabled) -->
          <!-- <div class="settings-section">
            <app-push-settings></app-push-settings>
          </div> -->
        </div>

        <!-- Success/Error Messages -->
        <div class="message success-message" *ngIf="successMessage">
          <i class="fas fa-check-circle"></i>
          {{ successMessage }}
        </div>

        <div class="message error-message" *ngIf="errorMessage">
          <i class="fas fa-exclamation-circle"></i>
          {{ errorMessage }}
        </div>
      </div>
    </div>
  `,
  styles: [`
    .profile-container {
      max-width: 1000px;
      margin: 0 auto;
      padding: 20px;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    .profile-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 16px;
      padding: 40px;
      margin-bottom: 30px;
      color: white;
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 24px;
    }

    .avatar-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }

    .profile-avatar {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      object-fit: cover;
      border: 4px solid rgba(255, 255, 255, 0.3);
    }

    .change-avatar-btn {
      background: rgba(255, 255, 255, 0.2);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.3);
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 0.8rem;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .change-avatar-btn:hover {
      background: rgba(255, 255, 255, 0.3);
    }

    .user-info h1 {
      margin: 0 0 8px 0;
      font-size: 2rem;
      font-weight: 600;
    }

    .user-email {
      margin: 0 0 12px 0;
      opacity: 0.8;
      font-size: 1.1rem;
    }

    .role-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(255, 255, 255, 0.2);
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 0.9rem;
      font-weight: 500;
    }

    .role-badge.admin { background: rgba(231, 76, 60, 0.3); }
    .role-badge.editor { background: rgba(52, 152, 219, 0.3); }
    .role-badge.writer { background: rgba(46, 204, 113, 0.3); }
    .role-badge.reader { background: rgba(155, 89, 182, 0.3); }

    .header-actions .btn {
      background: rgba(255, 255, 255, 0.2);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.3);
      padding: 10px 20px;
      border-radius: 8px;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-weight: 500;
      transition: all 0.3s ease;
    }

    .header-actions .btn:hover {
      background: rgba(255, 255, 255, 0.3);
    }

    .profile-content {
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
      overflow: hidden;
    }

    .profile-tabs {
      display: flex;
      border-bottom: 1px solid #e9ecef;
    }

    .tab-btn {
      flex: 1;
      padding: 16px 24px;
      border: none;
      background: transparent;
      color: #666;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .tab-btn:hover {
      background: #f8f9fa;
      color: #333;
    }

    .tab-btn.active {
      background: #667eea;
      color: white;
    }

    .tab-content {
      padding: 40px;
    }

    .settings-section h2 {
      margin: 0 0 8px 0;
      font-size: 1.5rem;
      color: #2c3e50;
    }

    .settings-section p {
      margin: 0 0 32px 0;
      color: #666;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }

    .form-group {
      margin-bottom: 24px;
    }

    .form-group label {
      display: block;
      font-weight: 600;
      color: #333;
      margin-bottom: 8px;
      font-size: 0.9rem;
    }

    .form-input,
    .form-textarea {
      width: 100%;
      padding: 12px 16px;
      border: 2px solid #e1e5e9;
      border-radius: 8px;
      font-size: 1rem;
      transition: border-color 0.3s ease;
      font-family: inherit;
    }

    .form-input:focus,
    .form-textarea:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .form-textarea {
      resize: vertical;
      min-height: 100px;
    }

    .char-count {
      text-align: right;
      font-size: 0.8rem;
      color: #666;
      margin-top: 4px;
    }

    .preference-group {
      margin-bottom: 32px;
    }

    .preference-group h3 {
      margin: 0 0 16px 0;
      font-size: 1.2rem;
      color: #2c3e50;
    }

    .checkbox-group {
      margin-bottom: 16px;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      cursor: pointer;
      font-size: 0.95rem;
      color: #333;
    }

    .checkbox-label input[type="checkbox"] {
      opacity: 0;
      position: absolute;
    }

    .checkmark {
      width: 18px;
      height: 18px;
      border: 2px solid #e1e5e9;
      border-radius: 4px;
      margin-right: 12px;
      position: relative;
      transition: all 0.3s ease;
      flex-shrink: 0;
    }

    .checkbox-label input[type="checkbox"]:checked + .checkmark {
      background: #667eea;
      border-color: #667eea;
    }

    .checkbox-label input[type="checkbox"]:checked + .checkmark::after {
      content: '✓';
      position: absolute;
      color: white;
      font-size: 12px;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }

    .form-actions {
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #e9ecef;
    }

    .btn {
      padding: 12px 24px;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 0.95rem;
    }

    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .loading-spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top: 2px solid white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .message {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      border-radius: 6px;
      margin: 20px 0;
      font-size: 0.9rem;
    }

    .success-message {
      background: #f0fdf4;
      color: #15803d;
      border: 1px solid #bbf7d0;
    }

    .error-message {
      background: #fdf2f2;
      color: #dc2626;
      border: 1px solid #fecaca;
    }

    .form-input.error,
    .form-textarea.error {
      border-color: #e74c3c;
      box-shadow: 0 0 0 3px rgba(231, 76, 60, 0.1);
    }

    .error-message {
      color: #e74c3c;
      font-size: 0.85rem;
      margin-top: 6px;
    }

    @media (max-width: 768px) {
      .profile-container {
        padding: 16px;
      }

      .profile-header {
        flex-direction: column;
        gap: 20px;
        text-align: center;
        padding: 30px 20px;
      }

      .header-content {
        flex-direction: column;
        text-align: center;
      }

      .form-row {
        grid-template-columns: 1fr;
      }

      .profile-tabs {
        flex-direction: column;
      }

      .tab-content {
        padding: 24px 20px;
      }
    }
  `]
})
export class ProfileComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  currentUser: User | null = null;
  activeTab = 'profile';

  profileForm: FormGroup;
  passwordForm: FormGroup;
  preferencesForm: FormGroup;

  isUpdatingProfile = false;
  isChangingPassword = false;
  isUpdatingPreferences = false;

  successMessage = '';
  errorMessage = '';

  constructor() {
    this.profileForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      bio: ['', [Validators.maxLength(500)]],
      avatar: ['', [Validators.pattern('https?://.+')]]
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });

    this.preferencesForm = this.fb.group({
      emailOnNewComment: [true],
      emailOnNewFollower: [true],
      emailDigest: [false],
      profilePublic: [true],
      showEmail: [false]
    });
  }

  ngOnInit(): void {
    this.loadUserProfile();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadUserProfile(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
        if (user) {
          this.profileForm.patchValue({
            username: user.username,
            email: user.email,
            bio: user.bio || '',
            avatar: user.avatar || ''
          });
        }
      });
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
    this.clearMessages();
  }

  updateProfile(): void {
    if (this.profileForm.invalid) return;

    this.isUpdatingProfile = true;
    this.clearMessages();

    const updateData = this.profileForm.value;

    this.authService.updateProfile(updateData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user) => {
          this.successMessage = 'Profile updated successfully!';
          this.isUpdatingProfile = false;
          setTimeout(() => this.successMessage = '', 5000);
        },
        error: (error) => {
          this.errorMessage = error || 'Failed to update profile';
          this.isUpdatingProfile = false;
        }
      });
  }

  changePassword(): void {
    if (this.passwordForm.invalid) return;

    this.isChangingPassword = true;
    this.clearMessages();

    const passwordData = {
      currentPassword: this.passwordForm.value.currentPassword,
      newPassword: this.passwordForm.value.newPassword,
      confirmPassword: this.passwordForm.value.confirmPassword
    };

    this.authService.changePassword(passwordData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.successMessage = 'Password changed successfully!';
          this.passwordForm.reset();
          this.isChangingPassword = false;
          setTimeout(() => this.successMessage = '', 5000);
        },
        error: (error) => {
          this.errorMessage = error || 'Failed to change password';
          this.isChangingPassword = false;
        }
      });
  }

  updatePreferences(): void {
    this.isUpdatingPreferences = true;
    this.clearMessages();

    // Simulate API call for preferences (not implemented in backend yet)
    setTimeout(() => {
      this.successMessage = 'Preferences saved successfully!';
      this.isUpdatingPreferences = false;
      setTimeout(() => this.successMessage = '', 5000);
    }, 1000);
  }

  changeAvatar(): void {
    const avatarUrl = prompt('Enter new avatar URL:');
    if (avatarUrl) {
      this.profileForm.patchValue({ avatar: avatarUrl });
    }
  }

  getRoleClass(): string {
    return this.currentUser?.role.toLowerCase() || 'reader';
  }

  getRoleIcon(): string {
    const icons = {
      [UserRole.ADMIN]: 'fas fa-crown',
      [UserRole.EDITOR]: 'fas fa-edit',
      [UserRole.WRITER]: 'fas fa-pen',
      [UserRole.READER]: 'fas fa-book'
    };
    return icons[this.currentUser?.role || UserRole.READER];
  }

  getRoleDisplayName(): string {
    const names = {
      [UserRole.ADMIN]: 'Administrator',
      [UserRole.EDITOR]: 'Editor',
      [UserRole.WRITER]: 'Writer',
      [UserRole.READER]: 'Reader'
    };
    return names[this.currentUser?.role || UserRole.READER];
  }

  getBioLength(): number {
    return this.profileForm.get('bio')?.value?.length || 0;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.profileForm.get(fieldName);
    return field ? field.invalid && (field.dirty || field.touched) : false;
  }

  isPasswordFieldInvalid(fieldName: string): boolean {
    const field = this.passwordForm.get(fieldName);
    return field ? field.invalid && (field.dirty || field.touched) : false;
  }

  private passwordMatchValidator(form: any) {
    const newPassword = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');
    
    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  private clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }

  onImageError(event: any): void {
    event.target.src = '/assets/default-avatar.png';
  }
}