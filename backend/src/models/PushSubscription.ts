import { Schema, model, Document } from 'mongoose';

export interface IPushSubscription extends Document {
  userId: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userAgent?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @swagger
 * components:
 *   schemas:
 *     PushSubscription:
 *       type: object
 *       required:
 *         - userId
 *         - endpoint
 *         - keys
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique identifier for the push subscription
 *         userId:
 *           type: string
 *           description: ID of the user who owns this subscription
 *         endpoint:
 *           type: string
 *           description: Push service endpoint URL
 *         keys:
 *           type: object
 *           properties:
 *             p256dh:
 *               type: string
 *               description: P256DH key for encryption
 *             auth:
 *               type: string
 *               description: Auth key for encryption
 *         userAgent:
 *           type: string
 *           description: User agent string of the browser
 *         isActive:
 *           type: boolean
 *           description: Whether the subscription is active
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Subscription creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 */

const pushSubscriptionSchema = new Schema<IPushSubscription>({
  userId: {
    type: String,
    required: [true, 'User ID is required'],
    ref: 'User',
    index: true
  },
  endpoint: {
    type: String,
    required: [true, 'Endpoint is required'],
    unique: true
  },
  keys: {
    p256dh: {
      type: String,
      required: [true, 'P256DH key is required']
    },
    auth: {
      type: String,
      required: [true, 'Auth key is required']
    }
  },
  userAgent: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc: any, ret: any) {
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes for better performance
pushSubscriptionSchema.index({ userId: 1, isActive: 1 });
pushSubscriptionSchema.index({ endpoint: 1 }, { unique: true });

// Extend the model interface
declare global {
  namespace Models {
    interface PushSubscriptionModel {
      findActiveByUserId(userId: string): Promise<IPushSubscription[]>;
      deactivateByEndpoint(endpoint: string): Promise<IPushSubscription | null>;
      cleanupInactive(daysOld?: number): Promise<any>;
    }
  }
}

// Static method to find active subscriptions for a user
pushSubscriptionSchema.statics.findActiveByUserId = function(userId: string) {
  return this.find({ userId, isActive: true });
};

// Static method to deactivate subscription by endpoint
pushSubscriptionSchema.statics.deactivateByEndpoint = function(endpoint: string) {
  return this.findOneAndUpdate(
    { endpoint },
    { isActive: false },
    { new: true }
  );
};

// Static method to cleanup old inactive subscriptions
pushSubscriptionSchema.statics.cleanupInactive = function(daysOld: number = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  return this.deleteMany({
    isActive: false,
    updatedAt: { $lt: cutoffDate }
  });
};

export default model<IPushSubscription>('PushSubscription', pushSubscriptionSchema);