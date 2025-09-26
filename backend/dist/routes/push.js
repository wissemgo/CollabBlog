"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPushNotificationToUser = void 0;
const express_1 = __importDefault(require("express"));
const web_push_1 = __importDefault(require("web-push"));
const errorHandler_1 = require("../middleware/errorHandler");
const auth_1 = require("../middleware/auth");
const PushSubscription_1 = __importDefault(require("../models/PushSubscription"));
const router = express_1.default.Router();
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa40HI0DLLjz7_QqM5UaKMxnhV9YLn8_v9Gk7nTdHOPP2Q2X2jj1jn4Mv7mXRo';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa40HI0DLLjz7_QqM5UaKMxnhV9YLn8_v9Gk7nTdHOPP2Q2X2jj1jn4Mv7mXRo';
const vapidEmail = process.env.VAPID_EMAIL || 'mailto:admin@collabblog.com';
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    web_push_1.default.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);
}
else {
    console.warn('VAPID keys not configured. Push notifications will not work.');
}
router.post('/subscribe', auth_1.authenticate, (0, errorHandler_1.catchAsync)(async (req, res) => {
    const { endpoint, keys } = req.body;
    const userId = req.user._id.toString();
    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
        throw (0, errorHandler_1.createError)('Invalid subscription data', 400);
    }
    try {
        let subscription = await PushSubscription_1.default.findOne({ endpoint });
        if (subscription) {
            subscription.userId = userId;
            subscription.keys = keys;
            subscription.isActive = true;
            const userAgent = req.get('User-Agent');
            if (userAgent) {
                subscription.userAgent = userAgent;
            }
            await subscription.save();
        }
        else {
            subscription = new PushSubscription_1.default({
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
    }
    catch (error) {
        if (error.code === 11000) {
            throw (0, errorHandler_1.createError)('Subscription already exists for this endpoint', 400);
        }
        throw error;
    }
}));
router.post('/unsubscribe', auth_1.authenticate, (0, errorHandler_1.catchAsync)(async (req, res) => {
    const { endpoint } = req.body;
    const userId = req.user._id.toString();
    if (!endpoint) {
        throw (0, errorHandler_1.createError)('Endpoint is required', 400);
    }
    const subscription = await PushSubscription_1.default.findOneAndUpdate({ endpoint, userId }, { isActive: false }, { new: true });
    if (!subscription) {
        throw (0, errorHandler_1.createError)('Subscription not found', 404);
    }
    const response = {
        success: true,
        message: 'Successfully unsubscribed from push notifications'
    };
    res.status(200).json(response);
}));
router.post('/test', auth_1.authenticate, (0, errorHandler_1.catchAsync)(async (req, res) => {
    const userId = req.user._id.toString();
    const subscriptions = await PushSubscription_1.default.find({ userId, isActive: true });
    if (subscriptions.length === 0) {
        throw (0, errorHandler_1.createError)('No active push subscriptions found', 404);
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
    const results = await Promise.allSettled(subscriptions.map(async (subscription) => {
        try {
            await web_push_1.default.sendNotification({
                endpoint: subscription.endpoint,
                keys: {
                    p256dh: subscription.keys.p256dh,
                    auth: subscription.keys.auth
                }
            }, payload);
            return { success: true, subscriptionId: subscription._id };
        }
        catch (error) {
            if (error.statusCode === 410) {
                await PushSubscription_1.default.findOneAndUpdate({ endpoint: subscription.endpoint }, { isActive: false }, { new: true });
            }
            return { success: false, subscriptionId: subscription._id, error: error.message };
        }
    }));
    const successful = results.filter((r) => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.length - successful;
    const response = {
        success: true,
        message: `Test notification sent to ${successful} subscription(s)`,
        data: {
            total: results.length,
            successful,
            failed,
            results: results.map((r) => r.status === 'fulfilled' ? r.value : r.reason)
        }
    };
    res.status(200).json(response);
}));
router.get('/subscriptions', auth_1.authenticate, (0, errorHandler_1.catchAsync)(async (req, res) => {
    const userId = req.user._id.toString();
    const subscriptions = await PushSubscription_1.default.find({ userId })
        .select('endpoint isActive userAgent createdAt updatedAt')
        .sort({ createdAt: -1 });
    const response = {
        success: true,
        message: 'Subscriptions retrieved successfully',
        data: {
            subscriptions: subscriptions.map((sub) => ({
                id: sub._id,
                endpoint: sub.endpoint.substring(0, 50) + '...',
                isActive: sub.isActive,
                userAgent: sub.userAgent,
                createdAt: sub.createdAt,
                updatedAt: sub.updatedAt
            })),
            total: subscriptions.length,
            active: subscriptions.filter((sub) => sub.isActive).length
        }
    };
    res.status(200).json(response);
}));
router.get('/vapid-public-key', (req, res) => {
    const response = {
        success: true,
        message: 'VAPID public key retrieved successfully',
        data: {
            publicKey: vapidPublicKey
        }
    };
    res.status(200).json(response);
});
const sendPushNotificationToUser = async (userId, title, body, data) => {
    try {
        const subscriptions = await PushSubscription_1.default.find({ userId, isActive: true });
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
        await Promise.allSettled(subscriptions.map(async (subscription) => {
            try {
                await web_push_1.default.sendNotification({
                    endpoint: subscription.endpoint,
                    keys: {
                        p256dh: subscription.keys.p256dh,
                        auth: subscription.keys.auth
                    }
                }, payload);
            }
            catch (error) {
                console.error(`Failed to send push notification to ${subscription.endpoint}:`, error.message);
                if (error.statusCode === 410) {
                    await PushSubscription_1.default.findOneAndUpdate({ endpoint: subscription.endpoint }, { isActive: false }, { new: true });
                }
            }
        }));
    }
    catch (error) {
        console.error('Error sending push notification:', error);
    }
};
exports.sendPushNotificationToUser = sendPushNotificationToUser;
exports.default = router;
//# sourceMappingURL=push.js.map