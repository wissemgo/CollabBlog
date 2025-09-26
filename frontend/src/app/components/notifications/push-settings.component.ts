import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PushNotificationService } from '../../services/push-notification.service';

@Component({
  selector: 'app-push-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="push-settings">
      <div class="settings-header">
        <h3>🔔 Push Notifications</h3>
        <p>Stay updated with real-time notifications</p>
      </div>

      <div class="notification-status" *ngIf="!isSupported">
        <div class="status-card error">
          <span class="icon">❌</span>
          <div class="status-content">
            <h4>Not Supported</h4>
            <p>Your browser doesn't support push notifications</p>
          </div>
        </div>
      </div>

      <div class="notification-status" *ngIf="isSupported">
        <div class="status-card" [class]="getStatusClass()">
          <span class="icon">{{getStatusIcon()}}</span>
          <div class="status-content">
            <h4>{{getStatusTitle()}}</h4>
            <p>{{getStatusDescription()}}</p>
          </div>
          <div class="status-actions">
            <button 
              *ngIf="permission === 'default'" 
              class="btn-primary" 
              (click)="enableNotifications()"
              [disabled]="isLoading">
              {{isLoading ? 'Setting up...' : 'Enable Notifications'}}
            </button>
            <button 
              *ngIf="permission === 'granted' && !isSubscribed" 
              class="btn-primary" 
              (click)="subscribe()"
              [disabled]="isLoading">
              {{isLoading ? 'Subscribing...' : 'Subscribe'}}
            </button>
            <button 
              *ngIf="permission === 'granted' && isSubscribed" 
              class="btn-secondary" 
              (click)="unsubscribe()"
              [disabled]="isLoading">
              {{isLoading ? 'Unsubscribing...' : 'Unsubscribe'}}
            </button>
          </div>
        </div>
      </div>

      <div class="notification-types" *ngIf="permission === 'granted'">
        <h4>Notification Types</h4>
        <div class="types-list">
          <div class="type-item">
            <div class="type-info">
              <span class="type-icon">💬</span>
              <div class="type-content">
                <h5>Comments</h5>
                <p>When someone comments on your articles</p>
              </div>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" [(ngModel)]="settings.comments" (change)="updateSettings()">
              <span class="slider"></span>
            </label>
          </div>

          <div class="type-item">
            <div class="type-info">
              <span class="type-icon">❤️</span>
              <div class="type-content">
                <h5>Likes</h5>
                <p>When someone likes your content</p>
              </div>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" [(ngModel)]="settings.likes" (change)="updateSettings()">
              <span class="slider"></span>
            </label>
          </div>

          <div class="type-item">
            <div class="type-info">
              <span class="type-icon">🏷️</span>
              <div class="type-content">
                <h5>Mentions</h5>
                <p>When you're mentioned in articles or comments</p>
              </div>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" [(ngModel)]="settings.mentions" (change)="updateSettings()">
              <span class="slider"></span>
            </label>
          </div>

          <div class="type-item">
            <div class="type-info">
              <span class="type-icon">📝</span>
              <div class="type-content">
                <h5>Article Updates</h5>
                <p>New articles from authors you follow</p>
              </div>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" [(ngModel)]="settings.articles" (change)="updateSettings()">
              <span class="slider"></span>
            </label>
          </div>

          <div class="type-item">
            <div class="type-info">
              <span class="type-icon">⚙️</span>
              <div class="type-content">
                <h5>System Notifications</h5>
                <p>Important updates and announcements</p>
              </div>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" [(ngModel)]="settings.system" (change)="updateSettings()">
              <span class="slider"></span>
            </label>
          </div>
        </div>
      </div>

      <div class="test-section" *ngIf="isSubscribed">
        <h4>Test Notifications</h4>
        <button class="btn-outline" (click)="sendTestNotification()" [disabled]="isLoading">
          🧪 Send Test Notification
        </button>
      </div>
    </div>
  `,
  styles: [`
    .push-settings {
      background: rgba(255, 255, 255, 0.95);
      border-radius: 15px;
      padding: 2rem;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
    }

    .settings-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .settings-header h3 {
      margin: 0 0 0.5rem 0;
      font-size: 1.5rem;
      color: #333;
    }

    .settings-header p {
      margin: 0;
      color: #666;
    }

    .status-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.5rem;
      border-radius: 12px;
      margin-bottom: 2rem;
      border: 2px solid;
    }

    .status-card.success {
      background: #d4edda;
      border-color: #27ae60;
      color: #155724;
    }

    .status-card.warning {
      background: #fff3cd;
      border-color: #f39c12;
      color: #856404;
    }

    .status-card.error {
      background: #f8d7da;
      border-color: #e74c3c;
      color: #721c24;
    }

    .status-card .icon {
      font-size: 2rem;
      flex-shrink: 0;
    }

    .status-content {
      flex: 1;
    }

    .status-content h4 {
      margin: 0 0 0.5rem 0;
      font-size: 1.2rem;
    }

    .status-content p {
      margin: 0;
      opacity: 0.8;
    }

    .status-actions {
      flex-shrink: 0;
    }

    .notification-types {
      margin-bottom: 2rem;
    }

    .notification-types h4 {
      margin: 0 0 1rem 0;
      color: #333;
      font-size: 1.2rem;
    }

    .types-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .type-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      background: #f8f9ff;
      border-radius: 10px;
      border: 1px solid #e9ecef;
    }

    .type-info {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex: 1;
    }

    .type-icon {
      font-size: 1.5rem;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: white;
      border-radius: 50%;
      border: 2px solid #e9ecef;
    }

    .type-content h5 {
      margin: 0 0 0.25rem 0;
      color: #333;
      font-size: 1rem;
    }

    .type-content p {
      margin: 0;
      color: #666;
      font-size: 0.9rem;
    }

    .toggle-switch {
      position: relative;
      display: inline-block;
      width: 50px;
      height: 26px;
    }

    .toggle-switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }

    .slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: #ccc;
      transition: 0.4s;
      border-radius: 26px;
    }

    .slider:before {
      position: absolute;
      content: "";
      height: 20px;
      width: 20px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: 0.4s;
      border-radius: 50%;
    }

    input:checked + .slider {
      background-color: #667eea;
    }

    input:checked + .slider:before {
      transform: translateX(24px);
    }

    .test-section {
      text-align: center;
      padding-top: 2rem;
      border-top: 1px solid #e9ecef;
    }

    .test-section h4 {
      margin: 0 0 1rem 0;
      color: #333;
    }

    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.3s ease;
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: #6c757d;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.3s ease;
    }

    .btn-secondary:hover:not(:disabled) {
      background: #545b62;
      transform: translateY(-2px);
    }

    .btn-outline {
      background: transparent;
      color: #667eea;
      border: 2px solid #667eea;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.3s ease;
    }

    .btn-outline:hover:not(:disabled) {
      background: #667eea;
      color: white;
      transform: translateY(-2px);
    }

    @media (max-width: 768px) {
      .push-settings {
        padding: 1rem;
        margin: 1rem;
      }

      .status-card {
        flex-direction: column;
        text-align: center;
        gap: 1rem;
      }

      .type-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }

      .toggle-switch {
        align-self: flex-end;
      }
    }
  `]
})
export class PushSettingsComponent implements OnInit {
  isSupported = false;
  permission: NotificationPermission = 'default';
  isSubscribed = false;
  isLoading = false;

  settings = {
    comments: true,
    likes: true,
    mentions: true,
    articles: true,
    system: true
  };

  constructor(private pushService: PushNotificationService) {}

  ngOnInit() {
    this.isSupported = this.pushService.isServiceWorkerSupported;
    
    if (this.isSupported) {
      this.pushService.permission$.subscribe(permission => {
        this.permission = permission;
      });

      this.pushService.subscription$.subscribe(subscription => {
        this.isSubscribed = !!subscription;
      });

      this.loadSettings();
    }
  }

  async enableNotifications() {
    this.isLoading = true;
    try {
      await this.pushService.requestPermission();
      if (this.permission === 'granted') {
        await this.subscribe();
      }
    } catch (error) {
      console.error('Failed to enable notifications:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async subscribe() {
    this.isLoading = true;
    try {
      await this.pushService.subscribeToNotifications();
    } catch (error) {
      console.error('Failed to subscribe:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async unsubscribe() {
    this.isLoading = true;
    try {
      await this.pushService.unsubscribeFromNotifications();
    } catch (error) {
      console.error('Failed to unsubscribe:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async sendTestNotification() {
    this.isLoading = true;
    try {
      await this.pushService.showLocalNotification('Test Notification', {
        body: 'This is a test notification from your blog platform!',
        tag: 'test'
      });
    } catch (error) {
      console.error('Failed to send test notification:', error);
    } finally {
      this.isLoading = false;
    }
  }

  updateSettings() {
    localStorage.setItem('pushNotificationSettings', JSON.stringify(this.settings));
  }

  private loadSettings() {
    const saved = localStorage.getItem('pushNotificationSettings');
    if (saved) {
      this.settings = { ...this.settings, ...JSON.parse(saved) };
    }
  }

  getStatusClass(): string {
    switch (this.permission) {
      case 'granted':
        return this.isSubscribed ? 'success' : 'warning';
      case 'denied':
        return 'error';
      default:
        return 'warning';
    }
  }

  getStatusIcon(): string {
    switch (this.permission) {
      case 'granted':
        return this.isSubscribed ? '✅' : '⚠️';
      case 'denied':
        return '❌';
      default:
        return '🔔';
    }
  }

  getStatusTitle(): string {
    switch (this.permission) {
      case 'granted':
        return this.isSubscribed ? 'Notifications Enabled' : 'Ready to Subscribe';
      case 'denied':
        return 'Notifications Blocked';
      default:
        return 'Enable Notifications';
    }
  }

  getStatusDescription(): string {
    switch (this.permission) {
      case 'granted':
        return this.isSubscribed 
          ? 'You\'ll receive push notifications for your selected preferences'
          : 'Click subscribe to start receiving notifications';
      case 'denied':
        return 'Notifications are blocked. Enable them in your browser settings.';
      default:
        return 'Get notified about comments, likes, and new articles';
    }
  }
}