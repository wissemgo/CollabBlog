import { Component, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';

// Custom validator for password confirmation
function passwordMatchValidator(control: AbstractControl): { [key: string]: any } | null {
  const password = control.get('password');
  const confirmPassword = control.get('confirmPassword');
  
  if (password && confirmPassword && password.value !== confirmPassword.value) {
    return { 'passwordMismatch': true };
  }
  return null;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <h1>Join CollabBlog</h1>
          <p>Create your account and start writing</p>
        </div>

        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="auth-form">
          <!-- Username Field -->
          <div class="form-group">
            <label for="username">Username</label>
            <input
              type="text"
              id="username"
              formControlName="username"
              placeholder="Choose a unique username"
              [class.error]="isFieldInvalid('username')"
            >
            <div class="error-message" *ngIf="isFieldInvalid('username')">
              <span *ngIf="registerForm.get('username')?.errors?.['required']">Username is required</span>
              <span *ngIf="registerForm.get('username')?.errors?.['minlength']">
                Username must be at least 3 characters
              </span>
              <span *ngIf="registerForm.get('username')?.errors?.['maxlength']">
                Username cannot exceed 30 characters
              </span>
              <span *ngIf="registerForm.get('username')?.errors?.['pattern']">
                Username can only contain letters, numbers, and underscores
              </span>
            </div>
          </div>

          <!-- Email Field -->
          <div class="form-group">
            <label for="email">Email Address</label>
            <input
              type="email"
              id="email"
              formControlName="email"
              placeholder="Enter your email"
              [class.error]="isFieldInvalid('email')"
            >
            <div class="error-message" *ngIf="isFieldInvalid('email')">
              <span *ngIf="registerForm.get('email')?.errors?.['required']">Email is required</span>
              <span *ngIf="registerForm.get('email')?.errors?.['email']">Please enter a valid email</span>
            </div>
          </div>

          <!-- Password Field -->
          <div class="form-group">
            <label for="password">Password</label>
            <div class="password-input">
              <input
                [type]="showPassword ? 'text' : 'password'"
                id="password"
                formControlName="password"
                placeholder="Create a strong password"
                [class.error]="isFieldInvalid('password')"
              >
              <button
                type="button"
                class="password-toggle"
                (click)="togglePassword()"
                [attr.aria-label]="showPassword ? 'Hide password' : 'Show password'"
              >
                <i [class]="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
              </button>
            </div>
            <div class="password-strength" *ngIf="registerForm.get('password')?.value">
              <div class="strength-bar">
                <div 
                  class="strength-fill" 
                  [class]="getPasswordStrengthClass()"
                  [style.width]="getPasswordStrengthWidth()"
                ></div>
              </div>
              <span class="strength-text">{{ getPasswordStrengthText() }}</span>
            </div>
            <div class="error-message" *ngIf="isFieldInvalid('password')">
              <span *ngIf="registerForm.get('password')?.errors?.['required']">Password is required</span>
              <span *ngIf="registerForm.get('password')?.errors?.['minlength']">
                Password must be at least 8 characters
              </span>
            </div>
          </div>

          <!-- Confirm Password Field -->
          <div class="form-group">
            <label for="confirmPassword">Confirm Password</label>
            <div class="password-input">
              <input
                [type]="showConfirmPassword ? 'text' : 'password'"
                id="confirmPassword"
                formControlName="confirmPassword"
                placeholder="Confirm your password"
                [class.error]="isFieldInvalid('confirmPassword') || registerForm.errors?.['passwordMismatch']"
              >
              <button
                type="button"
                class="password-toggle"
                (click)="toggleConfirmPassword()"
                [attr.aria-label]="showConfirmPassword ? 'Hide password' : 'Show password'"
              >
                <i [class]="showConfirmPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
              </button>
            </div>
            <div class="error-message" *ngIf="isFieldInvalid('confirmPassword') || registerForm.errors?.['passwordMismatch']">
              <span *ngIf="registerForm.get('confirmPassword')?.errors?.['required']">Please confirm your password</span>
              <span *ngIf="registerForm.errors?.['passwordMismatch']">Passwords do not match</span>
            </div>
          </div>

          <!-- Terms Agreement -->
          <div class="form-group checkbox-group">
            <label class="checkbox-label">
              <input type="checkbox" formControlName="agreeToTerms">
              <span class="checkmark"></span>
              I agree to the <a href="/terms" target="_blank" class="link">Terms of Service</a> and 
              <a href="/privacy" target="_blank" class="link">Privacy Policy</a>
            </label>
            <div class="error-message" *ngIf="isFieldInvalid('agreeToTerms')">
              <span>You must agree to the terms and conditions</span>
            </div>
          </div>

          <!-- Error Message -->
          <div class="error-message global-error" *ngIf="errorMessage">
            <i class="fas fa-exclamation-circle"></i>
            {{ errorMessage }}
          </div>

          <!-- Success Message -->
          <div class="success-message" *ngIf="successMessage">
            <i class="fas fa-check-circle"></i>
            {{ successMessage }}
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            class="btn btn-primary"
            [disabled]="registerForm.invalid || isLoading"
          >
            <span *ngIf="isLoading" class="loading-spinner"></span>
            {{ isLoading ? 'Creating Account...' : 'Create Account' }}
          </button>
        </form>

        <!-- Divider -->
        <div class="divider">
          <span>or</span>
        </div>

        <!-- Login Link -->
        <div class="auth-footer">
          <p>Already have an account? <a routerLink="/auth/login" class="link">Sign in here</a></p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }

    .auth-card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
      padding: 40px;
      width: 100%;
      max-width: 460px;
      animation: slideIn 0.5s ease-out;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .auth-header {
      text-align: center;
      margin-bottom: 32px;
    }

    .auth-header h1 {
      font-size: 2rem;
      font-weight: 700;
      margin-bottom: 8px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .auth-header p {
      color: #666;
      font-size: 1rem;
      margin: 0;
    }

    .auth-form {
      margin-bottom: 24px;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-group label {
      display: block;
      font-weight: 600;
      color: #333;
      margin-bottom: 8px;
      font-size: 0.9rem;
    }

    .form-group input[type="email"],
    .form-group input[type="password"],
    .form-group input[type="text"] {
      width: 100%;
      padding: 12px 16px;
      border: 2px solid #e1e5e9;
      border-radius: 8px;
      font-size: 1rem;
      transition: all 0.3s ease;
      background: white;
    }

    .form-group input:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .form-group input.error {
      border-color: #e74c3c;
      box-shadow: 0 0 0 3px rgba(231, 76, 60, 0.1);
    }

    .password-input {
      position: relative;
    }

    .password-toggle {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      color: #666;
      cursor: pointer;
      font-size: 1rem;
      padding: 4px;
      transition: color 0.3s ease;
    }

    .password-toggle:hover {
      color: #333;
    }

    .password-strength {
      margin-top: 8px;
    }

    .strength-bar {
      width: 100%;
      height: 4px;
      background: #e1e5e9;
      border-radius: 2px;
      overflow: hidden;
    }

    .strength-fill {
      height: 100%;
      transition: all 0.3s ease;
      border-radius: 2px;
    }

    .strength-fill.weak {
      background: #e74c3c;
    }

    .strength-fill.medium {
      background: #f39c12;
    }

    .strength-fill.strong {
      background: #27ae60;
    }

    .strength-text {
      font-size: 0.8rem;
      margin-top: 4px;
      display: block;
    }

    .checkbox-group {
      margin-bottom: 24px;
    }

    .checkbox-label {
      display: flex;
      align-items: flex-start;
      cursor: pointer;
      font-size: 0.9rem;
      color: #666;
      margin-bottom: 0;
      line-height: 1.4;
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
      margin-right: 8px;
      margin-top: 1px;
      flex-shrink: 0;
      position: relative;
      transition: all 0.3s ease;
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

    .error-message {
      color: #e74c3c;
      font-size: 0.85rem;
      margin-top: 6px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .global-error {
      background: #fdf2f2;
      border: 1px solid #fecaca;
      border-radius: 6px;
      padding: 12px;
      margin-bottom: 20px;
      font-size: 0.9rem;
    }

    .success-message {
      background: #f0fdf4;
      color: #15803d;
      border: 1px solid #bbf7d0;
      border-radius: 6px;
      padding: 12px;
      margin-bottom: 20px;
      font-size: 0.9rem;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .btn {
      width: 100%;
      padding: 14px 24px;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
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
      opacity: 0.7;
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

    .divider {
      text-align: center;
      margin: 24px 0;
      position: relative;
    }

    .divider::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 0;
      right: 0;
      height: 1px;
      background: #e1e5e9;
    }

    .divider span {
      background: white;
      padding: 0 16px;
      color: #666;
      font-size: 0.9rem;
      position: relative;
    }

    .auth-footer {
      text-align: center;
    }

    .auth-footer p {
      margin: 0;
      color: #666;
      font-size: 0.9rem;
    }

    .link {
      color: #667eea;
      text-decoration: none;
      font-weight: 600;
      transition: color 0.3s ease;
    }

    .link:hover {
      color: #5a67d8;
      text-decoration: underline;
    }

    @media (max-width: 480px) {
      .auth-container {
        padding: 16px;
      }

      .auth-card {
        padding: 28px 24px;
        margin: 0;
      }

      .auth-header h1 {
        font-size: 1.75rem;
      }
    }
  `]
})
export class RegisterComponent implements OnDestroy {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  registerForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  showPassword = false;
  showConfirmPassword = false;

  constructor() {
    this.registerForm = this.fb.group({
      username: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(30),
        Validators.pattern(/^[a-zA-Z0-9_]+$/)
      ]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
      agreeToTerms: [false, Validators.requiredTrue]
    }, { validators: passwordMatchValidator });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSubmit(): void {
    if (this.registerForm.valid && !this.isLoading) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';

      const registerData = {
        username: this.registerForm.value.username,
        email: this.registerForm.value.email,
        password: this.registerForm.value.password,
        confirmPassword: this.registerForm.value.confirmPassword
      };

      this.authService.register(registerData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            console.log('Registration successful:', response);
            this.successMessage = 'Account created successfully! Redirecting to dashboard...';
            setTimeout(() => {
              this.router.navigate(['/dashboard']);
            }, 2000);
          },
          error: (error) => {
            console.error('Registration error:', error);
            this.errorMessage = error || 'Registration failed. Please try again.';
            this.isLoading = false;
          }
        });
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return field ? field.invalid && (field.dirty || field.touched) : false;
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  getPasswordStrength(): number {
    const password = this.registerForm.get('password')?.value || '';
    let strength = 0;

    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    return strength;
  }

  getPasswordStrengthClass(): string {
    const strength = this.getPasswordStrength();
    if (strength <= 2) return 'weak';
    if (strength <= 3) return 'medium';
    return 'strong';
  }

  getPasswordStrengthWidth(): string {
    const strength = this.getPasswordStrength();
    return `${(strength / 5) * 100}%`;
  }

  getPasswordStrengthText(): string {
    const strength = this.getPasswordStrength();
    if (strength <= 2) return 'Weak password';
    if (strength <= 3) return 'Medium strength';
    return 'Strong password';
  }
}