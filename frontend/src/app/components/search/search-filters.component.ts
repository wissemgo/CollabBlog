import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';

interface SearchFilters {
  query: string;
  category: string;
  author: string;
  dateRange: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  tags: string[];
}

interface Category {
  id: string;
  name: string;
  count: number;
}

interface Author {
  id: string;
  username: string;
  articlesCount: number;
}

interface Tag {
  id: string;
  name: string;
  count: number;
}

@Component({
  selector: 'app-search-filters',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="search-filters-container">
      <!-- Search Bar -->
      <div class="search-section">
        <div class="search-bar">
          <div class="search-input-container">
            <input 
              type="text" 
              placeholder="Search articles, authors, or content..." 
              [(ngModel)]="filters.query"
              (input)="onSearchChange()"
              class="search-input">
            <button class="search-button" (click)="onSearch()">
              🔍
            </button>
          </div>
          
          <button 
            class="filter-toggle" 
            (click)="showAdvancedFilters = !showAdvancedFilters"
            [class.active]="showAdvancedFilters">
            <span>🔧</span>
            <span>Filters</span>
            <span class="filter-count" *ngIf="getActiveFilterCount() > 0">{{getActiveFilterCount()}}</span>
          </button>
        </div>

        <!-- Quick Search Suggestions -->
        <div class="search-suggestions" *ngIf="searchSuggestions.length > 0 && filters.query">
          <div class="suggestion-item" 
               *ngFor="let suggestion of searchSuggestions" 
               (click)="selectSuggestion(suggestion)">
            <span class="suggestion-type">{{suggestion.type}}</span>
            <span class="suggestion-text">{{suggestion.text}}</span>
          </div>
        </div>
      </div>

      <!-- Advanced Filters Panel -->
      <div class="advanced-filters" *ngIf="showAdvancedFilters">
        <div class="filters-header">
          <h3>Advanced Filters</h3>
          <button class="clear-filters" (click)="clearAllFilters()" *ngIf="getActiveFilterCount() > 0">
            Clear All
          </button>
        </div>

        <div class="filters-grid">
          <!-- Category Filter -->
          <div class="filter-group">
            <label>Category</label>
            <select [(ngModel)]="filters.category" (change)="onFilterChange()" class="filter-select">
              <option value="">All Categories</option>
              <option *ngFor="let category of categories" [value]="category.id">
                {{category.name}} ({{category.count}})
              </option>
            </select>
          </div>

          <!-- Author Filter -->
          <div class="filter-group">
            <label>Author</label>
            <select [(ngModel)]="filters.author" (change)="onFilterChange()" class="filter-select">
              <option value="">All Authors</option>
              <option *ngFor="let author of authors" [value]="author.id">
                {{author.username}} ({{author.articlesCount}})
              </option>
            </select>
          </div>

          <!-- Date Range Filter -->
          <div class="filter-group">
            <label>Date Range</label>
            <select [(ngModel)]="filters.dateRange" (change)="onFilterChange()" class="filter-select">
              <option value="">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">Last 3 Months</option>
              <option value="year">This Year</option>
            </select>
          </div>

          <!-- Sort Options -->
          <div class="filter-group">
            <label>Sort By</label>
            <div class="sort-controls">
              <select [(ngModel)]="filters.sortBy" (change)="onFilterChange()" class="filter-select">
                <option value="createdAt">Date Created</option>
                <option value="title">Title</option>
                <option value="author">Author</option>
                <option value="views">Views</option>
                <option value="likes">Likes</option>
                <option value="comments">Comments</option>
              </select>
              <button 
                class="sort-direction" 
                (click)="toggleSortDirection()"
                [title]="filters.sortOrder === 'asc' ? 'Ascending' : 'Descending'">
                {{filters.sortOrder === 'asc' ? '↑' : '↓'}}
              </button>
            </div>
          </div>
        </div>

        <!-- Tags Filter -->
        <div class="tags-section">
          <label>Tags</label>
          <div class="tags-container">
            <div class="popular-tags">
              <span class="tag-label">Popular:</span>
              <button 
                *ngFor="let tag of popularTags" 
                class="tag-button"
                [class.selected]="isTagSelected(tag.id)"
                (click)="toggleTag(tag.id)">
                {{tag.name}} ({{tag.count}})
              </button>
            </div>
            
            <div class="selected-tags" *ngIf="filters.tags.length > 0">
              <span class="tag-label">Selected:</span>
              <div class="selected-tag" *ngFor="let tagId of filters.tags">
                <span>{{getTagName(tagId)}}</span>
                <button class="remove-tag" (click)="removeTag(tagId)">×</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Search Results Info -->
        <div class="results-info" *ngIf="searchResultsCount !== null">
          <span class="results-text">
            Found {{searchResultsCount}} article{{searchResultsCount !== 1 ? 's' : ''}}
            <span *ngIf="filters.query"> for "{{filters.query}}"</span>
          </span>
          <span class="search-time" *ngIf="searchTime">
            ({{searchTime}}ms)
          </span>
        </div>
      </div>

      <!-- Active Filters Summary -->
      <div class="active-filters" *ngIf="getActiveFilterCount() > 0 && !showAdvancedFilters">
        <span class="active-label">Active filters:</span>
        <div class="active-filter-chips">
          <div class="filter-chip" *ngIf="filters.query">
            <span>Search: "{{filters.query}}"</span>
            <button (click)="clearFilter('query')">×</button>
          </div>
          <div class="filter-chip" *ngIf="filters.category">
            <span>Category: {{getCategoryName(filters.category)}}</span>
            <button (click)="clearFilter('category')">×</button>
          </div>
          <div class="filter-chip" *ngIf="filters.author">
            <span>Author: {{getAuthorName(filters.author)}}</span>
            <button (click)="clearFilter('author')">×</button>
          </div>
          <div class="filter-chip" *ngIf="filters.dateRange">
            <span>Date: {{getDateRangeLabel(filters.dateRange)}}</span>
            <button (click)="clearFilter('dateRange')">×</button>
          </div>
          <div class="filter-chip" *ngFor="let tagId of filters.tags">
            <span>Tag: {{getTagName(tagId)}}</span>
            <button (click)="removeTag(tagId)">×</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .search-filters-container {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      padding: 2rem;
      margin-bottom: 2rem;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .search-section {
      position: relative;
      margin-bottom: 1.5rem;
    }

    .search-bar {
      display: flex;
      gap: 1rem;
      align-items: center;
    }

    .search-input-container {
      flex: 1;
      position: relative;
      display: flex;
      align-items: center;
      background: white;
      border-radius: 25px;
      border: 2px solid #e9ecef;
      overflow: hidden;
      transition: all 0.3s ease;
    }

    .search-input-container:focus-within {
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .search-input {
      flex: 1;
      padding: 1rem 1.5rem;
      border: none;
      font-size: 1rem;
      background: transparent;
      outline: none;
    }

    .search-button {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 1rem 1.5rem;
      cursor: pointer;
      font-size: 1.2rem;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .search-button:hover {
      background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
    }

    .filter-toggle {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(102, 126, 234, 0.1);
      color: #667eea;
      border: 2px solid #667eea;
      padding: 0.75rem 1.5rem;
      border-radius: 25px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.3s ease;
      position: relative;
    }

    .filter-toggle:hover,
    .filter-toggle.active {
      background: #667eea;
      color: white;
    }

    .filter-count {
      background: #e74c3c;
      color: white;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8rem;
      font-weight: bold;
      position: absolute;
      top: -5px;
      right: -5px;
    }

    .search-suggestions {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: white;
      border-radius: 15px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
      z-index: 100;
      margin-top: 0.5rem;
      overflow: hidden;
      border: 1px solid #e9ecef;
    }

    .suggestion-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.5rem;
      cursor: pointer;
      transition: background-color 0.3s ease;
      border-bottom: 1px solid #f8f9fa;
    }

    .suggestion-item:hover {
      background: #f8f9ff;
    }

    .suggestion-item:last-child {
      border-bottom: none;
    }

    .suggestion-type {
      background: #667eea;
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: 15px;
      font-size: 0.8rem;
      font-weight: 500;
      text-transform: uppercase;
    }

    .suggestion-text {
      color: #333;
      font-weight: 500;
    }

    .advanced-filters {
      background: linear-gradient(135deg, #f8f9ff 0%, #e8f0ff 100%);
      border-radius: 15px;
      padding: 2rem;
      border: 2px solid rgba(102, 126, 234, 0.1);
      margin-top: 1rem;
    }

    .filters-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    .filters-header h3 {
      margin: 0;
      color: #333;
      font-size: 1.5rem;
      font-weight: 600;
    }

    .clear-filters {
      background: #e74c3c;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.3s ease;
    }

    .clear-filters:hover {
      background: #c0392b;
      transform: translateY(-2px);
    }

    .filters-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .filter-group label {
      font-weight: 600;
      color: #333;
      font-size: 0.9rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .filter-select {
      padding: 0.75rem;
      border: 2px solid #e9ecef;
      border-radius: 10px;
      background: white;
      color: #333;
      font-size: 1rem;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .filter-select:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .sort-controls {
      display: flex;
      gap: 0.5rem;
    }

    .sort-controls .filter-select {
      flex: 1;
    }

    .sort-direction {
      background: #667eea;
      color: white;
      border: none;
      padding: 0.75rem;
      border-radius: 10px;
      cursor: pointer;
      font-size: 1.2rem;
      font-weight: bold;
      transition: all 0.3s ease;
      width: 50px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .sort-direction:hover {
      background: #5a6fd8;
      transform: scale(1.1);
    }

    .tags-section {
      margin-top: 2rem;
    }

    .tags-section label {
      display: block;
      margin-bottom: 1rem;
      font-weight: 600;
      color: #333;
      font-size: 0.9rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .tags-container {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .popular-tags, .selected-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      align-items: center;
    }

    .tag-label {
      font-weight: 600;
      color: #666;
      font-size: 0.9rem;
      min-width: fit-content;
    }

    .tag-button {
      background: rgba(102, 126, 234, 0.1);
      color: #667eea;
      border: 2px solid transparent;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      cursor: pointer;
      font-size: 0.9rem;
      font-weight: 500;
      transition: all 0.3s ease;
    }

    .tag-button:hover {
      background: rgba(102, 126, 234, 0.2);
      transform: translateY(-2px);
    }

    .tag-button.selected {
      background: #667eea;
      color: white;
      border-color: #667eea;
    }

    .selected-tag {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: #667eea;
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-size: 0.9rem;
      font-weight: 500;
    }

    .remove-tag {
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      font-size: 1.2rem;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background-color 0.3s ease;
    }

    .remove-tag:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    .results-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 1.5rem;
      padding: 1rem;
      background: rgba(255, 255, 255, 0.8);
      border-radius: 10px;
      border-left: 4px solid #667eea;
    }

    .results-text {
      font-weight: 600;
      color: #333;
    }

    .search-time {
      color: #666;
      font-size: 0.9rem;
    }

    .active-filters {
      background: rgba(102, 126, 234, 0.05);
      border-radius: 15px;
      padding: 1rem 1.5rem;
      border-left: 4px solid #667eea;
      margin-top: 1rem;
    }

    .active-label {
      font-weight: 600;
      color: #333;
      margin-right: 1rem;
    }

    .active-filter-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      margin-top: 0.75rem;
    }

    .filter-chip {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: #667eea;
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-size: 0.9rem;
      font-weight: 500;
    }

    .filter-chip button {
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      font-size: 1.2rem;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background-color 0.3s ease;
    }

    .filter-chip button:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    @media (max-width: 768px) {
      .search-filters-container {
        padding: 1rem;
      }

      .search-bar {
        flex-direction: column;
        gap: 1rem;
      }

      .filters-grid {
        grid-template-columns: 1fr;
      }

      .popular-tags, .selected-tags {
        flex-direction: column;
        align-items: flex-start;
      }

      .active-filter-chips {
        flex-direction: column;
      }

      .results-info {
        flex-direction: column;
        gap: 0.5rem;
        align-items: flex-start;
      }
    }
  `]
})
export class SearchFiltersComponent implements OnInit, OnDestroy {
  @Input() searchResultsCount: number | null = null;
  @Input() searchTime: number | null = null;
  @Output() filtersChange = new EventEmitter<SearchFilters>();
  @Output() search = new EventEmitter<string>();

  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  showAdvancedFilters = false;
  
  filters: SearchFilters = {
    query: '',
    category: '',
    author: '',
    dateRange: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    tags: []
  };

  searchSuggestions: any[] = [];

  categories: Category[] = [
    { id: 'tech', name: 'Technology', count: 45 },
    { id: 'business', name: 'Business', count: 32 },
    { id: 'design', name: 'Design', count: 28 },
    { id: 'science', name: 'Science', count: 19 },
    { id: 'lifestyle', name: 'Lifestyle', count: 15 }
  ];

  authors: Author[] = [
    { id: 'john_doe', username: 'john_doe', articlesCount: 12 },
    { id: 'jane_smith', username: 'jane_smith', articlesCount: 8 },
    { id: 'tech_writer', username: 'tech_writer', articlesCount: 15 },
    { id: 'design_guru', username: 'design_guru', articlesCount: 6 }
  ];

  popularTags: Tag[] = [
    { id: 'javascript', name: 'JavaScript', count: 25 },
    { id: 'react', name: 'React', count: 18 },
    { id: 'css', name: 'CSS', count: 15 },
    { id: 'nodejs', name: 'Node.js', count: 12 },
    { id: 'typescript', name: 'TypeScript', count: 10 },
    { id: 'python', name: 'Python', count: 8 }
  ];

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    // Set up search debouncing
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(query => {
      this.search.emit(query);
      this.updateSearchSuggestions(query);
    });

    // Emit initial filters
    this.filtersChange.emit(this.filters);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearchChange() {
    this.searchSubject.next(this.filters.query);
  }

  onSearch() {
    this.search.emit(this.filters.query);
    this.onFilterChange();
  }

  onFilterChange() {
    this.filtersChange.emit({ ...this.filters });
  }

  updateSearchSuggestions(query: string) {
    if (!query || query.length < 2) {
      this.searchSuggestions = [];
      return;
    }

    // Mock suggestions - replace with actual API call
    this.searchSuggestions = [
      { type: 'article', text: `"${query}" in articles` },
      { type: 'author', text: `Authors matching "${query}"` },
      { type: 'tag', text: `"${query}" tag` }
    ].slice(0, 5);
  }

  selectSuggestion(suggestion: any) {
    if (suggestion.type === 'article') {
      this.filters.query = suggestion.text.match(/"([^"]+)"/)?.[1] || suggestion.text;
    } else if (suggestion.type === 'author') {
      const author = this.authors.find(a => 
        a.username.toLowerCase().includes(this.filters.query.toLowerCase())
      );
      if (author) {
        this.filters.author = author.id;
        this.filters.query = '';
      }
    } else if (suggestion.type === 'tag') {
      const tag = this.popularTags.find(t => 
        t.name.toLowerCase().includes(this.filters.query.toLowerCase())
      );
      if (tag && !this.filters.tags.includes(tag.id)) {
        this.filters.tags.push(tag.id);
        this.filters.query = '';
      }
    }
    
    this.searchSuggestions = [];
    this.onFilterChange();
  }

  toggleSortDirection() {
    this.filters.sortOrder = this.filters.sortOrder === 'asc' ? 'desc' : 'asc';
    this.onFilterChange();
  }

  toggleTag(tagId: string) {
    const index = this.filters.tags.indexOf(tagId);
    if (index > -1) {
      this.filters.tags.splice(index, 1);
    } else {
      this.filters.tags.push(tagId);
    }
    this.onFilterChange();
  }

  removeTag(tagId: string) {
    const index = this.filters.tags.indexOf(tagId);
    if (index > -1) {
      this.filters.tags.splice(index, 1);
      this.onFilterChange();
    }
  }

  isTagSelected(tagId: string): boolean {
    return this.filters.tags.includes(tagId);
  }

  getActiveFilterCount(): number {
    let count = 0;
    if (this.filters.query) count++;
    if (this.filters.category) count++;
    if (this.filters.author) count++;
    if (this.filters.dateRange) count++;
    count += this.filters.tags.length;
    return count;
  }

  clearAllFilters() {
    this.filters = {
      query: '',
      category: '',
      author: '',
      dateRange: '',
      sortBy: 'createdAt',
      sortOrder: 'desc',
      tags: []
    };
    this.onFilterChange();
  }

  clearFilter(filterType: string) {
    switch (filterType) {
      case 'query':
        this.filters.query = '';
        break;
      case 'category':
        this.filters.category = '';
        break;
      case 'author':
        this.filters.author = '';
        break;
      case 'dateRange':
        this.filters.dateRange = '';
        break;
    }
    this.onFilterChange();
  }

  getCategoryName(categoryId: string): string {
    const category = this.categories.find(c => c.id === categoryId);
    return category ? category.name : categoryId;
  }

  getAuthorName(authorId: string): string {
    const author = this.authors.find(a => a.id === authorId);
    return author ? author.username : authorId;
  }

  getTagName(tagId: string): string {
    const tag = this.popularTags.find(t => t.id === tagId);
    return tag ? tag.name : tagId;
  }

  getDateRangeLabel(dateRange: string): string {
    const labels = {
      'today': 'Today',
      'week': 'This Week',
      'month': 'This Month',
      'quarter': 'Last 3 Months',
      'year': 'This Year'
    };
    return labels[dateRange as keyof typeof labels] || dateRange;
  }
}