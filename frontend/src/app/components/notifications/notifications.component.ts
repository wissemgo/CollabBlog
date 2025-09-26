import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
}

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class=\"notifications\">
      <div class=\"bell\" (click)=\"toggle()\" [class.has-unread]=\"unreadCount > 0\">
        🔔
        <span class=\"count\" *ngIf=\"unreadCount > 0\">{{unreadCount}}</span>
      </div>
      
      <div class=\"dropdown\" *ngIf=\"show\">
        <h3>Notifications</h3>
        <div *ngFor=\"let n of notifications\" class=\"item\" [class.unread]=\"!n.isRead\">
          <strong>{{n.title}}</strong>
          <p>{{n.message}}</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .notifications { position: relative; }
    .bell { cursor: pointer; font-size: 1.5rem; position: relative; }
    .count { position: absolute; top: -5px; right: -5px; background: red; color: white; border-radius: 50%; font-size: 0.7rem; padding: 2px 6px; }
    .dropdown { position: absolute; top: 100%; right: 0; width: 300px; background: white; border-radius: 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); z-index: 1000; color: #333; }
    .dropdown h3 { margin: 0; padding: 1rem; background: #667eea; color: white; border-radius: 10px 10px 0 0; }
    .item { padding: 1rem; border-bottom: 1px solid #eee; }
    .item.unread { background: #f0f8ff; }
    .item strong { display: block; margin-bottom: 0.5rem; }
    .item p { margin: 0; color: #666; font-size: 0.9rem; }
  `]
})
export class NotificationsComponent implements OnInit {
  notifications: Notification[] = [];
  show = false;
  unreadCount = 0;

  ngOnInit() {
    this.notifications = [
      { id: '1', title: 'New Comment', message: 'John commented on your article', isRead: false },
      { id: '2', title: 'Article Liked', message: 'Jane liked your post', isRead: false }
    ];
    this.updateCount();
  }

  toggle() {
    this.show = !this.show;
  }

  updateCount() {
    this.unreadCount = this.notifications.filter(n => !n.isRead).length;
  }
}