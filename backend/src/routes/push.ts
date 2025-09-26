/**
 * Push notification routes for Web Push API
 */

import express from 'express';
import { Request, Response } from 'express';
import webpush from 'web-push';
import { catchAsync, createError } from '../middleware/errorHandler';
import { authenticate } from '../middleware/auth';
import PushSubscription, { IPushSubscription } from '../models/PushSubscription';
import { UserRole } from '../types';

const router = express.Router();

// Configure web-push with VAPID keys
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa40HI0DLLjz7_QqM5UaKMxnhV9YLn8_v9Gk7nTdHOPP2Q2X2jj1jn4Mv7mXRo';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa40HI0DLLjz7_QqM5UaKMxnhV9YLn8_v9Gk7nTdHOPP2Q2X2jj1jn4Mv7mXRo';
const vapidEmail = process.env.VAPID_EMAIL || 'mailto:admin@collabblog.com';

// Only configure VAPID if we have valid keys
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);
} else {
  console.warn('VAPID keys not configured. Push notifications will not work.');
}

/**
 * @swagger
 * /api/push/subscribe:
 *   post:
 *     summary: Subscribe to push notifications
 *     tags: [Push Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - endpoint
 *               - keys
 *             properties:
 *               endpoint:
 *                 type: string
 *                 description: Push service endpoint URL
 *               keys:
 *                 type: object
 *                 properties:
 *                   p256dh:
 *                     type: string
 *                   auth:
 *                     type: string
 *     responses:
 *       201:
 *         description: Successfully subscribed to push notifications
 *       400:
 *         description: Invalid subscription data
 *       401:
 *         description: Unauthorized
 */
router.post('/subscribe', authenticate, catchAsync(async (req: Request, res: Response) => {
  const { endpoint, keys } = req.body;
  const userId = req.user!._id.toString();

  // Validate subscription data
  if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
    throw createError('Invalid subscription data', 400);
  }

  try {
    // Check if subscription already exists
    let subscription = await PushSubscription.findOne({ endpoint });
    
    if (subscription) {
      // Update existing subscription
      subscription.userId = userId;
      subscription.keys = keys;
      subscription.isActive = true;
      const userAgent = req.get('User-Agent');
      if (userAgent) {
        subscription.userAgent = userAgent;
      }
      await subscription.save();
    } else {
      // Create new subscription
      subscription = new PushSubscription({
        userId,
        endpoint,
        keys,
        userAgent: req.get('User-Agent'),
        isActive: true
      });
      await subscription.save();
    }

    const response = {
      success: true,
      message: 'Successfully subscribed to push notifications',
      data: {
        subscriptionId: subscription._id
      }
    };

    res.status(201).json(response);
  } catch (error: any) {
    if (error.code === 11000) {
      throw createError('Subscription already exists for this endpoint', 400);
    }
    throw error;
  }
}));

/**
 * @swagger
 * /api/push/unsubscribe:
 *   post:
 *     summary: Unsubscribe from push notifications
 *     tags: [Push Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - endpoint
 *             properties:
 *               endpoint:
 *                 type: string
 *                 description: Push service endpoint URL
 *     responses:
 *       200:
 *         description: Successfully unsubscribed from push notifications
 *       404:
 *         description: Subscription not found
 *       401:
 *         description: Unauthorized
 */
router.post('/unsubscribe', authenticate, catchAsync(async (req: Request, res: Response) => {
  const { endpoint } = req.body;
  const userId = req.user!._id.toString();

  if (!endpoint) {
    throw createError('Endpoint is required', 400);
  }

  const subscription = await PushSubscription.findOneAndUpdate(
    { endpoint, userId },
    { isActive: false },
    { new: true }
  );

  if (!subscription) {
    throw createError('Subscription not found', 404);
  }

  const response = {
    success: true,
    message: 'Successfully unsubscribed from push notifications'
  };

  res.status(200).json(response);
}));

/**
 * @swagger
 * /api/push/test:
 *   post:
 *     summary: Send test push notification
 *     tags: [Push Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Test notification sent successfully
 *       404:
 *         description: No active subscriptions found
 *       401:
 *         description: Unauthorized
 */
router.post('/test', authenticate, catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!._id.toString();

  const subscriptions = await PushSubscription.find({ userId, isActive: true });

  if (subscriptions.length === 0) {
    throw createError('No active push subscriptions found', 404);
  }

  const payload = JSON.stringify({
    title: '🧪 Test Notification',
    body: 'This is a test notification from your CollabBlog platform!',
    icon: '/assets/icons/icon-192x192.png',
    badge: '/assets/icons/badge-72x72.png',
    tag: 'test',
    data: {
      type: 'test',
      url: '/dashboard',
      timestamp: new Date().toISOString()
    }
  });

  const results = await Promise.allSettled(
    subscriptions.map(async (subscription: IPushSubscription) => {
      try {
        await webpush.sendNotification({
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth
          }
        }, payload);
        return { success: true, subscriptionId: subscription._id };
      } catch (error: any) {
        // If subscription is invalid (410 Gone), deactivate it
        if (error.statusCode === 410) {
          await PushSubscription.findOneAndUpdate(
            { endpoint: subscription.endpoint },
            { isActive: false },
            { new: true }
          );
        }
        return { success: false, subscriptionId: subscription._id, error: error.message };
      }
    })
  );

  const successful = results.filter((r: any) => r.status === 'fulfilled' && r.value.success).length;
  const failed = results.length - successful;

  const response = {
    success: true,
    message: `Test notification sent to ${successful} subscription(s)`,
    data: {
      total: results.length,
      successful,
      failed,
      results: results.map((r: any) => r.status === 'fulfilled' ? r.value : r.reason)
    }
  };

  res.status(200).json(response);
}));

/**
 * @swagger
 * /api/push/subscriptions:
 *   get:
 *     summary: Get user's push subscriptions
 *     tags: [Push Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscriptions retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/subscriptions', authenticate, catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!._id.toString();

  const subscriptions = await PushSubscription.find({ userId })
    .select('endpoint isActive userAgent createdAt updatedAt')
    .sort({ createdAt: -1 });

  const response = {
    success: true,
    message: 'Subscriptions retrieved successfully',
    data: {
      subscriptions: subscriptions.map((sub: any) => ({
        id: sub._id,
        endpoint: sub.endpoint.substring(0, 50) + '...', // Truncate for security
        isActive: sub.isActive,
        userAgent: sub.userAgent,
        createdAt: sub.createdAt,
        updatedAt: sub.updatedAt
      })),
      total: subscriptions.length,
      active: subscriptions.filter((sub: any) => sub.isActive).length
    }
  };

  res.status(200).json(response);
}));

/**
 * @swagger
 * /api/push/vapid-public-key:
 *   get:
 *     summary: Get VAPID public key
 *     tags: [Push Notifications]
 *     responses:
 *       200:
 *         description: VAPID public key retrieved successfully
 */
router.get('/vapid-public-key', (req: Request, res: Response) => {
  const response = {
    success: true,
    message: 'VAPID public key retrieved successfully',
    data: {
      publicKey: vapidPublicKey
    }
  };

  res.status(200).json(response);
});

// Helper function to send notification to specific user
export const sendPushNotificationToUser = async (
  userId: string,
  title: string,
  body: string,
  data?: any
): Promise<void> => {
  try {
    const subscriptions = await PushSubscription.find({ userId, isActive: true });
    
    if (subscriptions.length === 0) {
      console.log(`No active push subscriptions found for user ${userId}`);
      return;
    }

    const payload = JSON.stringify({
      title,
      body,
      icon: '/assets/icons/icon-192x192.png',
      badge: '/assets/icons/badge-72x72.png',
      tag: data?.type || 'notification',
      data: {
        timestamp: new Date().toISOString(),
        ...data
      }
    });

    await Promise.allSettled(
      subscriptions.map(async (subscription: IPushSubscription) => {
        try {
          await webpush.sendNotification({
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.keys.p256dh,
              auth: subscription.keys.auth
            }
          }, payload);
        } catch (error: any) {
          console.error(`Failed to send push notification to ${subscription.endpoint}:`, error.message);
          // If subscription is invalid (410 Gone), deactivate it
          if (error.statusCode === 410) {
            await PushSubscription.findOneAndUpdate(
              { endpoint: subscription.endpoint },
              { isActive: false },
              { new: true }
            );
          }
        }
      })
    );
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
};

export default router;