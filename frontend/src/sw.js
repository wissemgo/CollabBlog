// Service Worker for Push Notifications
self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('Service Worker activating...');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', event => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const title = data.title || 'New Notification';
    const options = {
      body: data.body || 'You have a new notification',
      icon: '/assets/icons/icon-192x192.png',
      badge: '/assets/icons/badge-72x72.png',
      tag: data.tag || 'general',
      data: data.data || {},
      actions: data.actions || [
        {
          action: 'open',
          title: 'Open',
          icon: '/assets/icons/open.png'
        },
        {
          action: 'close',
          title: 'Close',
          icon: '/assets/icons/close.png'
        }
      ],
      requireInteraction: data.requireInteraction || false,
      silent: data.silent || false
    };

    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  } catch (error) {
    console.error('Error handling push event:', error);
    
    // Fallback notification
    const fallbackOptions = {
      body: 'You have a new notification',
      icon: '/assets/icons/icon-192x192.png',
      badge: '/assets/icons/badge-72x72.png'
    };
    
    event.waitUntil(
      self.registration.showNotification('New Notification', fallbackOptions)
    );
  }
});

self.addEventListener('notificationclick', event => {
  console.log('Notification clicked:', event);
  
  event.notification.close();

  const action = event.action;
  const data = event.notification.data;

  if (action === 'close') {
    return;
  }

  // Handle notification click
  const urlToOpen = getUrlToOpen(data, action);
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clients => {
        // Check if there's already a window/tab open with the target URL
        for (const client of clients) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        
        // If no existing window, open a new one
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      })
  );
});

self.addEventListener('notificationclose', event => {
  console.log('Notification closed:', event);
  
  // Track notification close events
  const data = event.notification.data;
  if (data && data.trackClose) {
    fetch('/api/notifications/track-close', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        notificationId: data.id,
        timestamp: new Date().toISOString()
      })
    }).catch(error => {
      console.error('Failed to track notification close:', error);
    });
  }
});

// Helper function to determine URL to open
function getUrlToOpen(data, action) {
  const baseUrl = self.location.origin;
  
  if (action === 'open' && data && data.url) {
    return baseUrl + data.url;
  }
  
  // Default routes based on notification type
  if (data && data.type) {
    switch (data.type) {
      case 'comment':
        return data.articleId 
          ? `${baseUrl}/articles/${data.articleId}#comments`
          : `${baseUrl}/dashboard`;
      case 'like':
        return data.articleId 
          ? `${baseUrl}/articles/${data.articleId}`
          : `${baseUrl}/dashboard`;
      case 'follow':
        return data.userId 
          ? `${baseUrl}/profile/${data.userId}`
          : `${baseUrl}/dashboard`;
      case 'article_published':
        return data.articleId 
          ? `${baseUrl}/articles/${data.articleId}`
          : `${baseUrl}/articles`;
      case 'system':
        return `${baseUrl}/dashboard`;
      default:
        return baseUrl;
    }
  }
  
  return baseUrl;
}

// Background sync for offline actions
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  try {
    // Handle any pending offline actions
    console.log('Performing background sync...');
    
    // This could include:
    // - Sending queued comments
    // - Uploading draft articles
    // - Syncing user interactions
    
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Handle messages from the main app
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: '1.0.0' });
  }
});