"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const pushSubscriptionSchema = new mongoose_1.Schema({
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
        transform: function (doc, ret) {
            delete ret.__v;
            return ret;
        }
    }
});
pushSubscriptionSchema.index({ userId: 1, isActive: 1 });
pushSubscriptionSchema.index({ endpoint: 1 }, { unique: true });
pushSubscriptionSchema.statics.findActiveByUserId = function (userId) {
    return this.find({ userId, isActive: true });
};
pushSubscriptionSchema.statics.deactivateByEndpoint = function (endpoint) {
    return this.findOneAndUpdate({ endpoint }, { isActive: false }, { new: true });
};
pushSubscriptionSchema.statics.cleanupInactive = function (daysOld = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    return this.deleteMany({
        isActive: false,
        updatedAt: { $lt: cutoffDate }
    });
};
exports.default = (0, mongoose_1.model)('PushSubscription', pushSubscriptionSchema);
//# sourceMappingURL=PushSubscription.js.map