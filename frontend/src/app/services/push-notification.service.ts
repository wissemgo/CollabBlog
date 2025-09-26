import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

interface PushSubscriptionInfo {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PushNotificationService {
  private isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
  private subscriptionSubject = new BehaviorSubject<PushSubscription | null>(null);
  private permissionSubject = new BehaviorSubject<NotificationPermission>('default');

  constructor() {
    this.checkPermission();
    this.getExistingSubscription();
  }

  get isServiceWorkerSupported(): boolean {
    return this.isSupported;
  }

  get subscription$(): Observable<PushSubscription | null> {
    return this.subscriptionSubject.asObservable();
  }

  get permission$(): Observable<NotificationPermission> {
    return this.permissionSubject.asObservable();
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported) {
      throw new Error('Push notifications are not supported');
    }

    const permission = await Notification.requestPermission();
    this.permissionSubject.next(permission);
    return permission;
  }

  async subscribeToNotifications(): Promise<PushSubscription | null> {
    try {
      if (!this.isSupported) {
        throw new Error('Push notifications are not supported');
      }

      // Request permission first
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Notification permission denied');
      }

      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      // Check if already subscribed
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        // Create new subscription
        const vapidPublicKey = 'BEl62iUYgUivxIkv69yViEuiBIa40HI0DLLjz7_QqM5UaKMxnhV9YLn8_v9Gk7nTdHOPP2Q2X2jj1jn4Mv7mXRo'; // Replace with your VAPID key
        
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey) as BufferSource
        });
      }

      this.subscriptionSubject.next(subscription);
      
      // Send subscription to server
      await this.sendSubscriptionToServer(subscription);
      
      return subscription;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      throw error;
    }
  }

  async unsubscribeFromNotifications(): Promise<boolean> {
    try {
      const subscription = this.subscriptionSubject.value;
      if (subscription) {
        const success = await subscription.unsubscribe();
        if (success) {
          this.subscriptionSubject.next(null);
          // Remove subscription from server
          await this.removeSubscriptionFromServer(subscription);
        }
        return success;
      }
      return false;
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      return false;
    }
  }

  async showLocalNotification(title: string, options?: NotificationOptions): Promise<void> {
    if (!this.isSupported || Notification.permission !== 'granted') {
      throw new Error('Notifications not permitted');
    }

    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(title, {
      icon: '/assets/icons/icon-192x192.png',
      badge: '/assets/icons/badge-72x72.png',
      ...options
    });
  }

  private checkPermission(): void {
    if (this.isSupported) {
      this.permissionSubject.next(Notification.permission);
    }
  }

  private async getExistingSubscription(): Promise<void> {
    if (!this.isSupported) return;

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        const subscription = await registration.pushManager.getSubscription();
        this.subscriptionSubject.next(subscription);
      }
    } catch (error) {
      console.error('Error getting existing subscription:', error);
    }
  }

  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    const subscriptionInfo: PushSubscriptionInfo = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')!),
        auth: this.arrayBufferToBase64(subscription.getKey('auth')!)
      }
    };

    // Send to your backend API
    try {
      await fetch(`${environment.apiUrl}/push/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(subscriptionInfo)
      });
    } catch (error) {
      console.error('Failed to send subscription to server:', error);
    }
  }

  private async removeSubscriptionFromServer(subscription: PushSubscription): Promise<void> {
    try {
      await fetch(`${environment.apiUrl}/push/unsubscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ endpoint: subscription.endpoint })
      });
    } catch (error) {
      console.error('Failed to remove subscription from server:', error);
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }
}