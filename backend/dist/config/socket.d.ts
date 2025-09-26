import { Server as SocketIOServer } from 'socket.io';
export declare const setupSocketIO: (io: SocketIOServer) => void;
export declare const emitToUser: (io: SocketIOServer, userId: string, event: string, data: any) => void;
export declare const emitToArticle: (io: SocketIOServer, articleId: string, event: string, data: any) => void;
export declare const broadcastNotification: (io: SocketIOServer, event: string, data: any) => void;
//# sourceMappingURL=socket.d.ts.map