import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, switchMap } from 'rxjs/operators';
import { ArticleService } from '../../services/article.service';
import { AuthService } from '../../services/auth.service';
import { Article, UserRole } from '../../models';

@Component({
  selector: 'app-article-editor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
  template: `
    <div class="editor-container">
      <div class="editor-header">
        <div class="header-left">
          <button 
            type="button" 
            (click)="goBack()" 
            class="btn btn-secondary"
          >
            <i class="fas fa-arrow-left"></i>
            Back
          </button>
          <h1>{{ isEditMode ? 'Edit Article' : 'Create New Article' }}</h1>
        </div>
        
        <div class="header-actions">
          <button 
            type="button"
            (click)="saveDraft()"
            [disabled]="articleForm.invalid || isLoading"
            class="btn btn-outline"
          >
            <i class="fas fa-save"></i>
            Save Draft
          </button>
          
          <button 
            type="button"
            (click)="publishArticle()"
            [disabled]="articleForm.invalid || isLoading"
            class="btn btn-primary"
          >
            <i class="fas fa-rocket"></i>
            {{ isEditMode ? 'Update & Publish' : 'Publish' }}
          </button>
        </div>
      </div>

      <form [formGroup]="articleForm" class="editor-form">
        <!-- Title -->
        <div class="form-group">
          <input
            type="text"
            formControlName="title"
            placeholder="Article title..."
            class="title-input"
            [class.error]="isFieldInvalid('title')"
          >
          <div class="error-message" *ngIf="isFieldInvalid('title')">
            <span *ngIf="articleForm.get('title')?.errors?.['required']">Title is required</span>
            <span *ngIf="articleForm.get('title')?.errors?.['minlength']">Title must be at least 5 characters</span>
            <span *ngIf="articleForm.get('title')?.errors?.['maxlength']">Title cannot exceed 200 characters</span>
          </div>
        </div>

        <!-- Summary -->
        <div class="form-group">
          <label for="summary">Summary</label>
          <textarea
            id="summary"
            formControlName="summary"
            placeholder="A brief summary of your article..."
            class="form-input"
            rows="3"
            [class.error]="isFieldInvalid('summary')"
          ></textarea>
          <div class="error-message" *ngIf="isFieldInvalid('summary')">
            <span *ngIf="articleForm.get('summary')?.errors?.['required']">Summary is required</span>
            <span *ngIf="articleForm.get('summary')?.errors?.['maxlength']">Summary cannot exceed 500 characters</span>
          </div>
        </div>
 
         <!-- Featured Image URL -->
         <div class="form-group">
           <label for="featuredImage">Featured Image URL (optional)</label>
           <input
             type="url"
             id="featuredImage"
             formControlName="featuredImage"
             placeholder="https://example.com/image.jpg"
             class="form-input"
             [class.error]="isFieldInvalid('featuredImage')"
           >
           <div class="error-message" *ngIf="isFieldInvalid('featuredImage')">
             <span *ngIf="articleForm.get('featuredImage')?.errors?.['url']">Please enter a valid URL</span>
           </div>
         </div>

        <!-- Category -->
        <div class="form-group">
          <label for="category">Category</label>
          <select
            id="category"
            formControlName="category"
            class="form-input"
            [class.error]="isFieldInvalid('category')"
          >
            <option value="">Select a category</option>
            <option *ngFor="let category of categories" [value]="category">{{ category }}</option>
          </select>
          <div class="error-message" *ngIf="isFieldInvalid('category')">
            <span *ngIf="articleForm.get('category')?.errors?.['required']">Category is required</span>
          </div>
        </div>

        <!-- Tags -->
        <div class="form-group">
          <label for="tags">Tags (comma-separated)</label>
          <input
            type="text"
            id="tags"
            [(ngModel)]="tagsString"
            placeholder="javascript, angular, tutorial"
            class="form-input"
            [ngModelOptions]="{standalone: true}"
          >
          <div class="tags-preview" *ngIf="getTagsArray().length > 0">
            <span class="tag" *ngFor="let tag of getTagsArray()">{{ tag }}</span>
          </div>
        </div>

        <!-- Content Editor -->
        <div class="form-group">
          <label for="content">Content</label>
          <textarea
            id="content"
            formControlName="content"
            placeholder="Write your article content here..."
            class="content-editor"
            rows="20"
            [class.error]="isFieldInvalid('content')"
          ></textarea>
          
          <div class="editor-footer">
            <div class="word-count">
              Words: {{ getWordCount() }} | Characters: {{ articleForm.get('content')?.value?.length || 0 }}
            </div>
          </div>
          
          <div class="error-message" *ngIf="isFieldInvalid('content')">
            <span *ngIf="articleForm.get('content')?.errors?.['required']">Content is required</span>
            <span *ngIf="articleForm.get('content')?.errors?.['minlength']">Content must be at least 100 characters</span>
          </div>
        </div>

        <!-- Error/Success Messages -->
        <div class="error-message global-error" *ngIf="errorMessage">
          <i class="fas fa-exclamation-circle"></i>
          {{ errorMessage }}
        </div>

        <div class="success-message" *ngIf="successMessage">
          <i class="fas fa-check-circle"></i>
          {{ successMessage }}
        </div>
      </form>
    </div>
  `,
  styles: [`
    .editor-container {
      max-width: 1000px;
      margin: 0 auto;
      padding: 20px;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    .editor-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #f0f0f0;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .header-left h1 {
      margin: 0;
      font-size: 1.8rem;
      color: #2c3e50;
      font-weight: 600;
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }

    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 0.9rem;
      text-decoration: none;
    }

    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
    }

    .btn-secondary {
      background: #6c757d;
      color: white;
    }

    .btn-secondary:hover:not(:disabled) {
      background: #545b62;
    }

    .btn-outline {
      background: white;
      color: #667eea;
      border: 2px solid #667eea;
    }

    .btn-outline:hover:not(:disabled) {
      background: #667eea;
      color: white;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .editor-form {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .form-group label {
      font-weight: 600;
      color: #333;
      font-size: 0.9rem;
    }

    .title-input {
      font-size: 2rem;
      font-weight: 700;
      border: none;
      outline: none;
      padding: 12px 0;
      border-bottom: 2px solid #e1e5e9;
      background: transparent;
      color: #2c3e50;
      transition: border-color 0.3s ease;
    }

    .title-input:focus {
      border-bottom-color: #667eea;
    }

    .title-input::placeholder {
      color: #bbb;
      font-weight: 400;
    }

    .form-input {
      padding: 12px 16px;
      border: 2px solid #e1e5e9;
      border-radius: 8px;
      font-size: 1rem;
      transition: border-color 0.3s ease;
    }

    .form-input:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .tags-preview {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 8px;
    }

    .tag {
      background: #667eea;
      color: white;
      padding: 4px 8px;
      border-radius: 16px;
      font-size: 0.8rem;
    }

    .content-editor {
      padding: 16px;
      border: 2px solid #e1e5e9;
      border-radius: 8px;
      font-size: 1rem;
      line-height: 1.6;
      resize: vertical;
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
      transition: border-color 0.3s ease;
    }

    .content-editor:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .editor-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      font-size: 0.8rem;
      color: #666;
    }

    .error-message {
      color: #e74c3c;
      font-size: 0.85rem;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .global-error {
      background: #fdf2f2;
      border: 1px solid #fecaca;
      border-radius: 6px;
      padding: 12px;
      margin: 16px 0;
      font-size: 0.9rem;
    }

    .success-message {
      background: #f0fdf4;
      color: #15803d;
      border: 1px solid #bbf7d0;
      border-radius: 6px;
      padding: 12px;
      margin: 16px 0;
      font-size: 0.9rem;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .form-input.error,
    .title-input.error,
    .content-editor.error {
      border-color: #e74c3c;
      box-shadow: 0 0 0 3px rgba(231, 76, 60, 0.1);
    }

    @media (max-width: 768px) {
      .editor-container {
        padding: 16px;
      }

      .editor-header {
        flex-direction: column;
        gap: 16px;
        align-items: stretch;
      }

      .header-actions {
        justify-content: center;
      }

      .title-input {
        font-size: 1.5rem;
      }
    }
  `]
})
export class ArticleEditorComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private articleService = inject(ArticleService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroy$ = new Subject<void>();

  articleForm: FormGroup;
  isEditMode = false;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  
  tagsString = '';
  categories: string[] = []; // New property for categories
  
  articleId: string | null = null;
  currentArticle: Article | null = null;

  constructor() {
    this.articleForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(200)]],
      content: ['', [Validators.required, Validators.minLength(100)]],
      summary: ['', [Validators.required, Validators.maxLength(500)]], // Added summary field
      category: ['', Validators.required],
      featuredImage: ['', [Validators.pattern('https?://.+')]]
    });
  }

  ngOnInit(): void {
    this.checkPermissions();
    this.checkEditMode();
    this.loadCategories(); // Load categories on init
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private checkPermissions(): void {
    if (!this.authService.hasRole(UserRole.WRITER)) {
      this.router.navigate(['/articles']);
      return;
    }
  }

  private checkEditMode(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.articleId = params['id'];
      if (this.articleId && this.articleId !== 'create') {
        this.isEditMode = true;
        this.loadArticle(this.articleId);
      } else if (this.articleId === 'create') {
        this.isEditMode = false;
        // No article to load, just initialize form for creation
      }
    });
  }

  private loadArticle(id: string): void {
    this.isLoading = true;
    this.articleService.getArticleById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (article: Article) => {
          this.currentArticle = article;
          this.populateForm(article);
          this.isLoading = false;
        },
        error: (error: any) => {
          this.errorMessage = 'Failed to load article: ' + error;
          this.isLoading = false;
        }
      });
  }

  private populateForm(article: Article): void {
    this.articleForm.patchValue({
      title: article.title,
      content: article.content,
      featuredImage: article.featuredImage || ''
    });
    
    this.tagsString = (article.tags || []).join(', ');
    this.articleForm.patchValue({ category: article.category }); // Populate category
  }

  private loadCategories(): void {
    const defaultCategories = ['Technology', 'Programming', 'Web Development', 'Databases', 'DevOps', 'Cloud'];
    this.articleService.getCategories().pipe(takeUntil(this.destroy$)).subscribe({
      next: (categories: string[]) => {
        this.categories = categories.length > 0 ? categories : defaultCategories;
      },
      error: (error: any) => {
        console.error('Failed to load categories from API, using defaults:', error);
        this.categories = defaultCategories;
      }
    });
  }

  saveDraft(): void {
    if (this.articleForm.invalid) return;
    
    this.isLoading = true;
    this.errorMessage = '';

    const formData = this.getFormData();
    
    const saveOperation = this.isEditMode
      ? this.articleService.updateArticle(this.articleId!, formData)
      : this.articleService.createArticle(formData);

    saveOperation.pipe(takeUntil(this.destroy$)).subscribe({
      next: (article: Article) => {
        this.successMessage = 'Draft saved successfully!';
        setTimeout(() => this.successMessage = '', 3000);
        
        if (!this.isEditMode) {
          this.isEditMode = true;
          this.articleId = article._id;
          this.currentArticle = article;
          this.router.navigate(['/articles/edit', article._id], { replaceUrl: true });
        }
        
        this.isLoading = false;
        this.articleForm.markAsPristine();
      },
      error: (error: any) => {
        this.errorMessage = 'Failed to save draft: ' + error;
        this.isLoading = false;
      }
    });
  }

  publishArticle(): void {
    if (this.articleForm.invalid) return;
    
    this.isLoading = true;
    this.errorMessage = '';

    const formData = this.getFormData();
    
    const publishOperation = this.isEditMode
      ? this.articleService.updateArticle(this.articleId!, formData).pipe(
          switchMap((article: Article) => this.articleService.publishArticle(article._id))
        )
      : this.articleService.createArticle(formData).pipe(
          switchMap((article: Article) => this.articleService.publishArticle(article._id))
        );

    publishOperation.pipe(takeUntil(this.destroy$)).subscribe({
      next: (article: Article) => {
        this.successMessage = 'Article published successfully!';
        setTimeout(() => {
          this.router.navigate(['/articles', article._id]);
        }, 2000);
      },
      error: (error: any) => {
        this.errorMessage = 'Failed to publish article: ' + error;
        this.isLoading = false;
      }
    });
  }

  private getFormData(): any {
    return {
      ...this.articleForm.value,
      tags: this.getTagsArray(),
      category: this.articleForm.value.category // Ensure category is included
    };
  }

  getTagsArray(): string[] {
    return this.tagsString
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
  }

  getWordCount(): number {
    const content = this.articleForm.get('content')?.value || '';
    return content.trim().split(/\s+/).filter((word: string) => word.length > 0).length;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.articleForm.get(fieldName);
    return field ? field.invalid && (field.dirty || field.touched) : false;
  }

  goBack(): void {
    if (this.articleForm.dirty) {
      const confirmLeave = confirm('You have unsaved changes. Are you sure you want to leave?');
      if (!confirmLeave) return;
    }
    
    this.router.navigate(['/dashboard']);
  }
}