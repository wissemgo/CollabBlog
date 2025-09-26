"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const errorHandler_1 = require("../middleware/errorHandler");
const auth_1 = require("../middleware/auth");
const types_1 = require("../types");
const router = express_1.default.Router();
router.get('/stats', auth_1.authenticate, (0, auth_1.authorize)(types_1.UserRole.EDITOR, types_1.UserRole.ADMIN), (0, errorHandler_1.catchAsync)(async (req, res) => {
    const response = {
        success: true,
        message: 'Statistics retrieved successfully',
        data: {
            stats: {
                totalUsers: 0,
                totalArticles: 0,
                totalComments: 0,
                totalViews: 0
            }
        }
    };
    res.status(200).json(response);
}));
exports.default = router;
//# sourceMappingURL=analytics.js.map