"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SharePlatform = exports.NotificationType = exports.ArticleStatus = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "admin";
    UserRole["EDITOR"] = "editor";
    UserRole["WRITER"] = "writer";
    UserRole["READER"] = "reader";
})(UserRole || (exports.UserRole = UserRole = {}));
var ArticleStatus;
(function (ArticleStatus) {
    ArticleStatus["DRAFT"] = "draft";
    ArticleStatus["PUBLISHED"] = "published";
    ArticleStatus["ARCHIVED"] = "archived";
    ArticleStatus["PENDING_REVIEW"] = "pending_review";
})(ArticleStatus || (exports.ArticleStatus = ArticleStatus = {}));
var NotificationType;
(function (NotificationType) {
    NotificationType["COMMENT"] = "comment";
    NotificationType["REPLY"] = "reply";
    NotificationType["LIKE"] = "like";
    NotificationType["MENTION"] = "mention";
    NotificationType["FOLLOW"] = "follow";
    NotificationType["ARTICLE_PUBLISHED"] = "article_published";
    NotificationType["SYSTEM"] = "system";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
var SharePlatform;
(function (SharePlatform) {
    SharePlatform["TWITTER"] = "twitter";
    SharePlatform["FACEBOOK"] = "facebook";
    SharePlatform["LINKEDIN"] = "linkedin";
    SharePlatform["REDDIT"] = "reddit";
    SharePlatform["EMAIL"] = "email";
    SharePlatform["COPY_LINK"] = "copy_link";
})(SharePlatform || (exports.SharePlatform = SharePlatform = {}));
//# sourceMappingURL=index.js.map