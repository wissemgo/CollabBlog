import { Document } from 'mongoose';
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
declare global {
    namespace Models {
        interface PushSubscriptionModel {
            findActiveByUserId(userId: string): Promise<IPushSubscription[]>;
            deactivateByEndpoint(endpoint: string): Promise<IPushSubscription | null>;
            cleanupInactive(daysOld?: number): Promise<any>;
        }
    }
}
declare const _default: import("mongoose").Model<IPushSubscription, {}, {}, {}, Document<unknown, {}, IPushSubscription, {}, {}> & IPushSubscription & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=PushSubscription.d.ts.map