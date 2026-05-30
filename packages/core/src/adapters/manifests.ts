import type { PlatformManifest } from "../models.js";

export const platformManifests: Record<string, PlatformManifest> = {
  mock: {
    id: "mock",
    name: "Mock Adapter",
    region: "global",
    homepage: "",
    supportedContentTypes: ["article", "video", "image-note", "qa-answer", "short-text", "long-form", "carousel", "link-post"],
    supportedPackageTypes: ["article-package", "video-package", "image-note-package"],
    publishLevels: ["simulate"],
    auth: { type: "mock", requiredScopes: [], note: "测试适配器" },
    assets: {
      supportedImageFormats: ["image/jpeg", "image/png", "image/webp"],
      supportedVideoFormats: ["video/mp4"],
      maxImageSizeBytes: 10 * 1024 * 1024,
      maxVideoSizeBytes: 100 * 1024 * 1024,
      maxVideoDurationSec: 600,
      maxCoverCount: 1,
      supportedContentTypes: ["article", "video"]
    },
    limits: { titleMaxLength: 100, bodyMaxLength: 50000, tagMaxCount: 10, imagesMaxCount: 20, videosMaxCount: 1 },
    riskLevel: "low",
    defaultMode: "simulate",
    featureFlags: { realPublish: false, draft: true, assist: true, status: false, metrics: false }
  },

  wechat: {
    id: "wechat",
    name: "微信公众号",
    region: "cn",
    homepage: "https://mp.weixin.qq.com",
    docs: ["https://developers.weixin.qq.com/doc/offiaccount/Draft_Box/Add_draft.html"],
    supportedContentTypes: ["article", "long-form", "image-note"],
    supportedPackageTypes: ["article-package", "wechat-article"],
    publishLevels: ["simulate", "draft", "submit", "publish", "status", "metrics"],
    auth: { type: "app-secret", requiredScopes: ["draft"], setupUrl: "https://mp.weixin.qq.com", note: "需要 AppID 和 AppSecret" },
    assets: {
      supportedImageFormats: ["image/jpeg", "image/png", "image/webp"],
      supportedVideoFormats: ["video/mp4"],
      maxImageSizeBytes: 10 * 1024 * 1024,
      maxVideoSizeBytes: 20 * 1024 * 1024,
      maxVideoDurationSec: 60,
      maxCoverCount: 1,
      supportedContentTypes: ["article", "long-form"]
    },
    limits: { titleMaxLength: 64, bodyMaxLength: 20000, tagMaxCount: 8, imagesMaxCount: 30, videosMaxCount: 3, summaryMaxLength: 120 },
    riskLevel: "medium",
    defaultMode: "draft",
    featureFlags: { realPublish: false, draft: true, assist: false, status: true, metrics: true, requiresIpWhitelist: true }
  },

  bilibili: {
    id: "bilibili",
    name: "B站",
    region: "cn",
    homepage: "https://www.bilibili.com",
    docs: ["https://open.bilibili.com"],
    supportedContentTypes: ["video", "article", "long-form"],
    supportedPackageTypes: ["video-package", "article-package", "bilibili-video", "bilibili-article"],
    publishLevels: ["simulate", "draft", "container", "submit", "publish", "status", "metrics"],
    auth: { type: "api-key", requiredScopes: ["video.upload", "article.submit"], setupUrl: "https://open.bilibili.com", note: "需要开放平台权限" },
    assets: {
      supportedImageFormats: ["image/jpeg", "image/png"],
      supportedVideoFormats: ["video/mp4", "video/quicktime"],
      maxImageSizeBytes: 5 * 1024 * 1024,
      maxVideoSizeBytes: 4 * 1024 * 1024 * 1024,
      maxVideoDurationSec: 3600,
      maxCoverCount: 1,
      supportedContentTypes: ["video", "article"]
    },
    limits: { titleMaxLength: 80, bodyMaxLength: 20000, tagMaxCount: 10, imagesMaxCount: 50, videosMaxCount: 1, summaryMaxLength: 250 },
    riskLevel: "medium",
    defaultMode: "simulate",
    featureFlags: { realPublish: false, draft: true, assist: false, status: true, metrics: true, chunkedUpload: true }
  },

  "zhihu-assist": {
    id: "zhihu-assist",
    name: "知乎辅助发布",
    region: "cn",
    homepage: "https://www.zhihu.com",
    supportedContentTypes: ["article", "qa-answer", "long-form"],
    supportedPackageTypes: ["article-package", "zhihu-article", "zhihu-answer"],
    publishLevels: ["simulate", "copy", "assist"],
    auth: { type: "browser-assist", requiredScopes: [], note: "通过浏览器辅助发布" },
    assets: {
      supportedImageFormats: ["image/jpeg", "image/png", "image/webp"],
      supportedVideoFormats: ["video/mp4"],
      maxImageSizeBytes: 10 * 1024 * 1024,
      maxVideoSizeBytes: 50 * 1024 * 1024,
      maxVideoDurationSec: 600,
      maxCoverCount: 0,
      supportedContentTypes: ["article", "qa-answer"]
    },
    limits: { titleMaxLength: 100, bodyMaxLength: 40000, tagMaxCount: 5, imagesMaxCount: 20, videosMaxCount: 1 },
    riskLevel: "low",
    defaultMode: "assist",
    featureFlags: { realPublish: false, draft: false, assist: true, share: true, copy: true }
  },

  "xhs-assist": {
    id: "xhs-assist",
    name: "小红书辅助发布",
    region: "cn",
    homepage: "https://creator.xiaohongshu.com",
    supportedContentTypes: ["image-note", "article", "video", "carousel"],
    supportedPackageTypes: ["image-note-package", "xhs-note", "xhs-video"],
    publishLevels: ["simulate", "copy", "share", "assist"],
    auth: { type: "browser-assist", requiredScopes: [], note: "通过浏览器或分享辅助发布" },
    assets: {
      supportedImageFormats: ["image/jpeg", "image/png", "image/webp"],
      supportedVideoFormats: ["video/mp4", "video/quicktime"],
      maxImageSizeBytes: 10 * 1024 * 1024,
      maxVideoSizeBytes: 100 * 1024 * 1024,
      maxVideoDurationSec: 300,
      maxCoverCount: 1,
      supportedContentTypes: ["image-note", "video", "carousel"]
    },
    limits: { titleMaxLength: 20, bodyMaxLength: 1000, tagMaxCount: 10, imagesMaxCount: 9, videosMaxCount: 1 },
    riskLevel: "low",
    defaultMode: "assist",
    featureFlags: { realPublish: false, draft: false, assist: true, share: true, copy: true, cardExport: true }
  },

  wordpress: {
    id: "wordpress",
    name: "WordPress",
    region: "global",
    homepage: "https://wordpress.org",
    docs: ["https://developer.wordpress.org/rest-api/"],
    supportedContentTypes: ["article", "long-form", "image-note"],
    supportedPackageTypes: ["article-package", "wordpress-post", "wordpress-page"],
    publishLevels: ["simulate", "draft", "submit", "publish", "status", "metrics"],
    auth: { type: "api-key", requiredScopes: ["posts"], setupUrl: "", note: "需要 Application Password 或 OAuth" },
    assets: {
      supportedImageFormats: ["image/jpeg", "image/png", "image/webp", "image/gif"],
      supportedVideoFormats: ["video/mp4", "video/webm"],
      maxImageSizeBytes: 50 * 1024 * 1024,
      maxVideoSizeBytes: 200 * 1024 * 1024,
      maxVideoDurationSec: 3600,
      maxCoverCount: 1,
      supportedContentTypes: ["article", "long-form"]
    },
    limits: { titleMaxLength: 200, bodyMaxLength: 100000, tagMaxCount: 20, imagesMaxCount: 100, videosMaxCount: 10, summaryMaxLength: 300 },
    riskLevel: "low",
    defaultMode: "draft",
    featureFlags: { realPublish: true, draft: true, assist: false, status: true, metrics: true }
  },

  // P1 platforms
  douyin: {
    id: "douyin",
    name: "抖音",
    region: "cn",
    homepage: "https://www.douyin.com",
    docs: ["https://open.douyin.com"],
    supportedContentTypes: ["video", "image-note"],
    supportedPackageTypes: ["video-package", "image-note-package", "douyin-video", "douyin-image"],
    publishLevels: ["simulate", "container", "submit", "publish", "status", "metrics"],
    auth: { type: "oauth2", requiredScopes: ["video.create", "video.upload"], setupUrl: "https://open.douyin.com", note: "需要开放平台权限和用户授权" },
    assets: {
      supportedImageFormats: ["image/jpeg", "image/png"],
      supportedVideoFormats: ["video/mp4"],
      maxImageSizeBytes: 10 * 1024 * 1024,
      maxVideoSizeBytes: 4 * 1024 * 1024 * 1024,
      maxVideoDurationSec: 1800,
      maxCoverCount: 1,
      supportedContentTypes: ["video", "image-note"]
    },
    limits: { titleMaxLength: 55, bodyMaxLength: 1000, tagMaxCount: 10, imagesMaxCount: 9, videosMaxCount: 1 },
    riskLevel: "medium",
    defaultMode: "simulate",
    featureFlags: { realPublish: false, draft: false, container: true, status: true, chunkedUpload: true }
  },

  kuaishou: {
    id: "kuaishou",
    name: "快手",
    region: "cn",
    homepage: "https://www.kuaishou.com",
    supportedContentTypes: ["video", "image-note"],
    supportedPackageTypes: ["video-package", "image-note-package"],
    publishLevels: ["simulate", "share", "container", "submit"],
    auth: { type: "oauth2", requiredScopes: ["video.upload"], setupUrl: "", note: "依赖开放平台申请与场景" },
    assets: { supportedImageFormats: ["image/jpeg", "image/png"], supportedVideoFormats: ["video/mp4"], maxImageSizeBytes: 10 * 1024 * 1024, maxVideoSizeBytes: 4 * 1024 * 1024 * 1024, maxVideoDurationSec: 1800, maxCoverCount: 1, supportedContentTypes: ["video"] },
    limits: { titleMaxLength: 50, bodyMaxLength: 500, tagMaxCount: 8, imagesMaxCount: 9, videosMaxCount: 1 },
    riskLevel: "medium",
    defaultMode: "simulate",
    featureFlags: { realPublish: false, container: true, share: true }
  },

  youtube: {
    id: "youtube",
    name: "YouTube",
    region: "global",
    homepage: "https://www.youtube.com",
    docs: ["https://developers.google.com/youtube/v3"],
    supportedContentTypes: ["video"],
    supportedPackageTypes: ["video-package", "youtube-video"],
    publishLevels: ["simulate", "container", "submit", "publish", "status", "metrics"],
    auth: { type: "oauth2", requiredScopes: ["youtube.upload"], setupUrl: "https://console.cloud.google.com", note: "需要 Google Cloud Console 和 OAuth" },
    assets: { supportedImageFormats: ["image/jpeg", "image/png"], supportedVideoFormats: ["video/mp4", "video/quicktime"], maxImageSizeBytes: 2 * 1024 * 1024, maxVideoSizeBytes: 256 * 1024 * 1024 * 1024, maxVideoDurationSec: 43200, maxCoverCount: 1, supportedContentTypes: ["video"] },
    limits: { titleMaxLength: 100, bodyMaxLength: 5000, tagMaxCount: 15, imagesMaxCount: 1, videosMaxCount: 1, summaryMaxLength: 5000 },
    riskLevel: "medium",
    defaultMode: "draft",
    featureFlags: { realPublish: false, draft: true, status: true, metrics: true, privateUpload: true }
  },

  instagram: {
    id: "instagram",
    name: "Instagram",
    region: "global",
    homepage: "https://www.instagram.com",
    docs: ["https://developers.facebook.com/docs/instagram-api"],
    supportedContentTypes: ["image-note", "video", "carousel"],
    supportedPackageTypes: ["image-package", "video-package", "carousel-package", "instagram-container"],
    publishLevels: ["simulate", "container", "submit", "publish", "status", "metrics"],
    auth: { type: "oauth2", requiredScopes: ["instagram_content_publish"], setupUrl: "https://developers.facebook.com", note: "需要 Business/Creator 账号和 Graph API 权限" },
    assets: { supportedImageFormats: ["image/jpeg", "image/png"], supportedVideoFormats: ["video/mp4"], maxImageSizeBytes: 8 * 1024 * 1024, maxVideoSizeBytes: 100 * 1024 * 1024, maxVideoDurationSec: 900, maxCoverCount: 1, supportedContentTypes: ["image-note", "video", "carousel"] },
    limits: { titleMaxLength: 2200, bodyMaxLength: 2200, tagMaxCount: 30, imagesMaxCount: 10, videosMaxCount: 1 },
    riskLevel: "medium",
    defaultMode: "draft",
    featureFlags: { realPublish: false, container: true, status: true, metrics: true }
  },

  threads: {
    id: "threads",
    name: "Threads",
    region: "global",
    homepage: "https://www.threads.net",
    supportedContentTypes: ["short-text", "image-note", "video", "carousel"],
    supportedPackageTypes: ["text-package", "image-package", "video-package", "carousel-package"],
    publishLevels: ["simulate", "submit", "publish", "status", "metrics"],
    auth: { type: "oauth2", requiredScopes: ["threads_basic"], setupUrl: "https://developers.facebook.com", note: "需要 Threads API 权限" },
    assets: { supportedImageFormats: ["image/jpeg", "image/png"], supportedVideoFormats: ["video/mp4"], maxImageSizeBytes: 8 * 1024 * 1024, maxVideoSizeBytes: 100 * 1024 * 1024, maxVideoDurationSec: 300, maxCoverCount: 0, supportedContentTypes: ["short-text", "image-note", "video", "carousel"] },
    limits: { titleMaxLength: 500, bodyMaxLength: 500, tagMaxCount: 10, imagesMaxCount: 10, videosMaxCount: 1 },
    riskLevel: "medium",
    defaultMode: "submit",
    featureFlags: { realPublish: false, status: true, metrics: true }
  },

  "facebook-pages": {
    id: "facebook-pages",
    name: "Facebook Pages",
    region: "global",
    homepage: "https://www.facebook.com",
    docs: ["https://developers.facebook.com/docs/pages-api"],
    supportedContentTypes: ["short-text", "long-form", "image-note", "video", "carousel"],
    supportedPackageTypes: ["text-package", "image-package", "video-package"],
    publishLevels: ["simulate", "submit", "publish", "status", "metrics"],
    auth: { type: "oauth2", requiredScopes: ["pages_manage_posts"], setupUrl: "https://developers.facebook.com", note: "需要 Page Access Token" },
    assets: { supportedImageFormats: ["image/jpeg", "image/png", "image/webp"], supportedVideoFormats: ["video/mp4"], maxImageSizeBytes: 10 * 1024 * 1024, maxVideoSizeBytes: 1 * 1024 * 1024 * 1024, maxVideoDurationSec: 7200, maxCoverCount: 1, supportedContentTypes: ["short-text", "long-form", "image-note", "video"] },
    limits: { titleMaxLength: 63206, bodyMaxLength: 63206, tagMaxCount: 30, imagesMaxCount: 10, videosMaxCount: 1 },
    riskLevel: "medium",
    defaultMode: "submit",
    featureFlags: { realPublish: false, status: true, metrics: true }
  },

  "x-twitter": {
    id: "x-twitter",
    name: "X/Twitter",
    region: "global",
    homepage: "https://x.com",
    docs: ["https://developer.x.com/en/docs/x-api"],
    supportedContentTypes: ["short-text", "image-note", "video"],
    supportedPackageTypes: ["text-package", "image-package", "video-package", "twitter-thread"],
    publishLevels: ["simulate", "submit", "publish", "status", "metrics"],
    auth: { type: "oauth2", requiredScopes: ["tweet.read", "tweet.write"], setupUrl: "https://developer.x.com", note: "X API v2 付费权限" },
    assets: { supportedImageFormats: ["image/jpeg", "image/png", "image/webp"], supportedVideoFormats: ["video/mp4"], maxImageSizeBytes: 5 * 1024 * 1024, maxVideoSizeBytes: 512 * 1024 * 1024, maxVideoDurationSec: 140, maxCoverCount: 0, supportedContentTypes: ["short-text", "image-note", "video"] },
    limits: { titleMaxLength: 280, bodyMaxLength: 280, tagMaxCount: 5, imagesMaxCount: 4, videosMaxCount: 1 },
    riskLevel: "medium",
    defaultMode: "submit",
    featureFlags: { realPublish: false, status: true, metrics: true, threadSupport: true }
  },

  linkedin: {
    id: "linkedin",
    name: "LinkedIn",
    region: "global",
    homepage: "https://www.linkedin.com",
    docs: ["https://learn.microsoft.com/en-us/linkedin/marketing/integrations/community-management/shares"],
    supportedContentTypes: ["short-text", "long-form", "image-note", "video"],
    supportedPackageTypes: ["text-package", "image-package", "video-package", "article-package"],
    publishLevels: ["simulate", "submit", "publish", "status", "metrics"],
    auth: { type: "oauth2", requiredScopes: ["w_member_social"], setupUrl: "https://www.linkedin.com/developers", note: "需要 LinkedIn App 和 UGC Post API 权限" },
    assets: { supportedImageFormats: ["image/jpeg", "image/png"], supportedVideoFormats: ["video/mp4"], maxImageSizeBytes: 10 * 1024 * 1024, maxVideoSizeBytes: 200 * 1024 * 1024, maxVideoDurationSec: 600, maxCoverCount: 1, supportedContentTypes: ["short-text", "long-form", "image-note", "video"] },
    limits: { titleMaxLength: 3000, bodyMaxLength: 3000, tagMaxCount: 10, imagesMaxCount: 9, videosMaxCount: 1 },
    riskLevel: "medium",
    defaultMode: "submit",
    featureFlags: { realPublish: false, status: true, metrics: true }
  },

  // P2 platforms
  pinterest: {
    id: "pinterest", name: "Pinterest", region: "global", homepage: "https://www.pinterest.com",
    supportedContentTypes: ["image-note", "video"],
    supportedPackageTypes: ["image-package", "video-package"],
    publishLevels: ["simulate", "submit", "publish", "status", "metrics"],
    auth: { type: "oauth2", requiredScopes: ["pins:write"], note: "Pinterest API v5" },
    assets: { supportedImageFormats: ["image/jpeg", "image/png"], supportedVideoFormats: ["video/mp4"], maxImageSizeBytes: 10 * 1024 * 1024, maxVideoSizeBytes: 100 * 1024 * 1024, maxVideoDurationSec: 300, maxCoverCount: 0, supportedContentTypes: ["image-note", "video"] },
    limits: { titleMaxLength: 100, bodyMaxLength: 500, tagMaxCount: 20, imagesMaxCount: 1, videosMaxCount: 1, summaryMaxLength: 500 },
    riskLevel: "low", defaultMode: "submit",
    featureFlags: { realPublish: false, status: true, metrics: true }
  },

  reddit: {
    id: "reddit", name: "Reddit", region: "global", homepage: "https://www.reddit.com",
    supportedContentTypes: ["link-post", "long-form"],
    supportedPackageTypes: ["text-package", "link-package"],
    publishLevels: ["simulate", "submit", "status"],
    auth: { type: "oauth2", requiredScopes: ["submit"], note: "Reddit API submit" },
    assets: { supportedImageFormats: ["image/jpeg", "image/png"], supportedVideoFormats: ["video/mp4"], maxImageSizeBytes: 5 * 1024 * 1024, maxVideoSizeBytes: 50 * 1024 * 1024, maxVideoDurationSec: 60, maxCoverCount: 0, supportedContentTypes: ["link-post", "long-form"] },
    limits: { titleMaxLength: 300, bodyMaxLength: 40000, tagMaxCount: 5, imagesMaxCount: 1, videosMaxCount: 1 },
    riskLevel: "medium", defaultMode: "submit",
    featureFlags: { realPublish: false, status: true }
  },

  medium: {
    id: "medium", name: "Medium", region: "global", homepage: "https://medium.com",
    supportedContentTypes: ["article", "long-form"],
    supportedPackageTypes: ["article-package"],
    publishLevels: ["simulate", "draft", "submit", "publish"],
    auth: { type: "oauth2", requiredScopes: ["basicProfile", "publishPost"], note: "Medium API" },
    assets: { supportedImageFormats: ["image/jpeg", "image/png"], supportedVideoFormats: [], maxImageSizeBytes: 5 * 1024 * 1024, maxVideoSizeBytes: 0, maxVideoDurationSec: 0, maxCoverCount: 0, supportedContentTypes: ["article", "long-form"] },
    limits: { titleMaxLength: 200, bodyMaxLength: 100000, tagMaxCount: 5, imagesMaxCount: 50, videosMaxCount: 0 },
    riskLevel: "low", defaultMode: "draft",
    featureFlags: { realPublish: false, draft: true, status: true }
  },

  mastodon: {
    id: "mastodon", name: "Mastodon", region: "global", homepage: "https://joinmastodon.org",
    supportedContentTypes: ["short-text", "image-note", "video"],
    supportedPackageTypes: ["text-package", "media-package"],
    publishLevels: ["simulate", "submit", "publish", "status", "metrics"],
    auth: { type: "oauth2", requiredScopes: ["write:statuses"], note: "Mastodon REST API" },
    assets: { supportedImageFormats: ["image/jpeg", "image/png", "image/webp"], supportedVideoFormats: ["video/mp4"], maxImageSizeBytes: 10 * 1024 * 1024, maxVideoSizeBytes: 40 * 1024 * 1024, maxVideoDurationSec: 120, maxCoverCount: 0, supportedContentTypes: ["short-text", "image-note", "video"] },
    limits: { titleMaxLength: 500, bodyMaxLength: 500, tagMaxCount: 10, imagesMaxCount: 4, videosMaxCount: 1 },
    riskLevel: "low", defaultMode: "submit",
    featureFlags: { realPublish: false, status: true, metrics: true }
  },

  bluesky: {
    id: "bluesky", name: "Bluesky", region: "global", homepage: "https://bsky.app",
    supportedContentTypes: ["short-text", "image-note"],
    supportedPackageTypes: ["text-package", "image-package"],
    publishLevels: ["simulate", "submit", "publish", "status"],
    auth: { type: "oauth2", requiredScopes: [], note: "AT Protocol 创建记录" },
    assets: { supportedImageFormats: ["image/jpeg", "image/png", "image/webp"], supportedVideoFormats: [], maxImageSizeBytes: 1 * 1024 * 1024, maxVideoSizeBytes: 0, maxVideoDurationSec: 0, maxCoverCount: 0, supportedContentTypes: ["short-text", "image-note"] },
    limits: { titleMaxLength: 300, bodyMaxLength: 300, tagMaxCount: 8, imagesMaxCount: 4, videosMaxCount: 0 },
    riskLevel: "low", defaultMode: "submit",
    featureFlags: { realPublish: false, status: true }
  },

  "telegram-channel": {
    id: "telegram-channel", name: "Telegram Channel", region: "global", homepage: "https://telegram.org",
    supportedContentTypes: ["short-text", "image-note", "video"],
    supportedPackageTypes: ["text-package", "media-package"],
    publishLevels: ["simulate", "submit", "publish", "status"],
    auth: { type: "bot-token", requiredScopes: [], note: "Bot API 发布到频道" },
    assets: { supportedImageFormats: ["image/jpeg", "image/png"], supportedVideoFormats: ["video/mp4"], maxImageSizeBytes: 10 * 1024 * 1024, maxVideoSizeBytes: 50 * 1024 * 1024, maxVideoDurationSec: 120, maxCoverCount: 0, supportedContentTypes: ["short-text", "image-note", "video"] },
    limits: { titleMaxLength: 200, bodyMaxLength: 4096, tagMaxCount: 5, imagesMaxCount: 1, videosMaxCount: 1 },
    riskLevel: "low", defaultMode: "submit",
    featureFlags: { realPublish: false, status: true }
  },

  discord: {
    id: "discord", name: "Discord", region: "global", homepage: "https://discord.com",
    supportedContentTypes: ["short-text", "long-form"],
    supportedPackageTypes: ["text-package", "discord-webhook"],
    publishLevels: ["simulate", "submit", "publish"],
    auth: { type: "webhook", requiredScopes: [], note: "Webhook / Bot API" },
    assets: { supportedImageFormats: ["image/jpeg", "image/png"], supportedVideoFormats: ["video/mp4"], maxImageSizeBytes: 8 * 1024 * 1024, maxVideoSizeBytes: 8 * 1024 * 1024, maxVideoDurationSec: 60, maxCoverCount: 0, supportedContentTypes: ["short-text", "long-form"] },
    limits: { titleMaxLength: 2000, bodyMaxLength: 2000, tagMaxCount: 0, imagesMaxCount: 5, videosMaxCount: 1 },
    riskLevel: "low", defaultMode: "submit",
    featureFlags: { realPublish: false }
  },

  ghost: {
    id: "ghost", name: "Ghost", region: "global", homepage: "https://ghost.org",
    supportedContentTypes: ["article", "long-form"],
    supportedPackageTypes: ["article-package", "ghost-post"],
    publishLevels: ["simulate", "draft", "submit", "publish"],
    auth: { type: "api-key", requiredScopes: [], note: "Ghost Admin API" },
    assets: { supportedImageFormats: ["image/jpeg", "image/png", "image/webp"], supportedVideoFormats: ["video/mp4"], maxImageSizeBytes: 10 * 1024 * 1024, maxVideoSizeBytes: 50 * 1024 * 1024, maxVideoDurationSec: 300, maxCoverCount: 1, supportedContentTypes: ["article", "long-form"] },
    limits: { titleMaxLength: 200, bodyMaxLength: 100000, tagMaxCount: 10, imagesMaxCount: 50, videosMaxCount: 5, summaryMaxLength: 300 },
    riskLevel: "low", defaultMode: "draft",
    featureFlags: { realPublish: false, draft: true, status: true }
  },

  // P3 platforms
  toutiao: {
    id: "toutiao", name: "今日头条", region: "cn", homepage: "https://www.toutiao.com",
    supportedContentTypes: ["article", "long-form", "image-note"],
    supportedPackageTypes: ["article-package"],
    publishLevels: ["simulate", "copy", "assist"],
    auth: { type: "browser-assist", requiredScopes: [], note: "RSS/内容源接入或辅助发布" },
    assets: { supportedImageFormats: ["image/jpeg", "image/png"], supportedVideoFormats: ["video/mp4"], maxImageSizeBytes: 10 * 1024 * 1024, maxVideoSizeBytes: 100 * 1024 * 1024, maxVideoDurationSec: 300, maxCoverCount: 1, supportedContentTypes: ["article", "image-note"] },
    limits: { titleMaxLength: 30, bodyMaxLength: 20000, tagMaxCount: 5, imagesMaxCount: 10, videosMaxCount: 1 },
    riskLevel: "low", defaultMode: "assist",
    featureFlags: { realPublish: false, copy: true, assist: true }
  },

  baijiahao: {
    id: "baijiahao", name: "百家号", region: "cn", homepage: "https://baijiahao.baidu.com",
    supportedContentTypes: ["article", "video", "image-note"],
    supportedPackageTypes: ["article-package", "video-package"],
    publishLevels: ["simulate", "copy", "assist"],
    auth: { type: "browser-assist", requiredScopes: [], note: "辅助发布" },
    assets: { supportedImageFormats: ["image/jpeg", "image/png"], supportedVideoFormats: ["video/mp4"], maxImageSizeBytes: 10 * 1024 * 1024, maxVideoSizeBytes: 500 * 1024 * 1024, maxVideoDurationSec: 1800, maxCoverCount: 1, supportedContentTypes: ["article", "video"] },
    limits: { titleMaxLength: 40, bodyMaxLength: 20000, tagMaxCount: 5, imagesMaxCount: 20, videosMaxCount: 1 },
    riskLevel: "low", defaultMode: "assist",
    featureFlags: { realPublish: false, copy: true, assist: true }
  },

  csdn: {
    id: "csdn", name: "CSDN", region: "cn", homepage: "https://www.csdn.net",
    supportedContentTypes: ["article"],
    supportedPackageTypes: ["article-package", "tech-article"],
    publishLevels: ["simulate", "copy", "assist"],
    auth: { type: "browser-assist", requiredScopes: [], note: "辅助发布" },
    assets: { supportedImageFormats: ["image/jpeg", "image/png"], supportedVideoFormats: [], maxImageSizeBytes: 5 * 1024 * 1024, maxVideoSizeBytes: 0, maxVideoDurationSec: 0, maxCoverCount: 1, supportedContentTypes: ["article"] },
    limits: { titleMaxLength: 64, bodyMaxLength: 50000, tagMaxCount: 5, imagesMaxCount: 50, videosMaxCount: 0 },
    riskLevel: "low", defaultMode: "assist",
    featureFlags: { realPublish: false, copy: true, assist: true }
  },

  juejin: {
    id: "juejin", name: "掘金", region: "cn", homepage: "https://juejin.cn",
    supportedContentTypes: ["article"],
    supportedPackageTypes: ["article-package", "tech-article"],
    publishLevels: ["simulate", "copy", "assist"],
    auth: { type: "browser-assist", requiredScopes: [], note: "辅助发布" },
    assets: { supportedImageFormats: ["image/jpeg", "image/png", "image/webp"], supportedVideoFormats: [], maxImageSizeBytes: 5 * 1024 * 1024, maxVideoSizeBytes: 0, maxVideoDurationSec: 0, maxCoverCount: 1, supportedContentTypes: ["article"] },
    limits: { titleMaxLength: 80, bodyMaxLength: 50000, tagMaxCount: 5, imagesMaxCount: 30, videosMaxCount: 0 },
    riskLevel: "low", defaultMode: "assist",
    featureFlags: { realPublish: false, copy: true, assist: true }
  },

  jianshu: {
    id: "jianshu", name: "简书", region: "cn", homepage: "https://www.jianshu.com",
    supportedContentTypes: ["article"],
    supportedPackageTypes: ["article-package"],
    publishLevels: ["simulate", "copy", "assist"],
    auth: { type: "browser-assist", requiredScopes: [], note: "辅助发布" },
    assets: { supportedImageFormats: ["image/jpeg", "image/png"], supportedVideoFormats: [], maxImageSizeBytes: 5 * 1024 * 1024, maxVideoSizeBytes: 0, maxVideoDurationSec: 0, maxCoverCount: 1, supportedContentTypes: ["article"] },
    limits: { titleMaxLength: 50, bodyMaxLength: 30000, tagMaxCount: 5, imagesMaxCount: 20, videosMaxCount: 0 },
    riskLevel: "low", defaultMode: "assist",
    featureFlags: { realPublish: false, copy: true, assist: true }
  },

  douban: {
    id: "douban", name: "豆瓣", region: "cn", homepage: "https://www.douban.com",
    supportedContentTypes: ["article", "long-form"],
    supportedPackageTypes: ["article-package"],
    publishLevels: ["simulate", "copy", "assist"],
    auth: { type: "browser-assist", requiredScopes: [], note: "辅助发布" },
    assets: { supportedImageFormats: ["image/jpeg", "image/png"], supportedVideoFormats: [], maxImageSizeBytes: 5 * 1024 * 1024, maxVideoSizeBytes: 0, maxVideoDurationSec: 0, maxCoverCount: 1, supportedContentTypes: ["article"] },
    limits: { titleMaxLength: 100, bodyMaxLength: 30000, tagMaxCount: 5, imagesMaxCount: 10, videosMaxCount: 0 },
    riskLevel: "low", defaultMode: "assist",
    featureFlags: { realPublish: false, copy: true, assist: true }
  },

  notion: {
    id: "notion", name: "Notion", region: "global", homepage: "https://www.notion.so",
    supportedContentTypes: ["article", "long-form", "link-post"],
    supportedPackageTypes: ["article-package", "notion-page"],
    publishLevels: ["simulate", "draft"],
    auth: { type: "api-key", requiredScopes: [], note: "作为内容库/归档，不作为公开平台" },
    assets: { supportedImageFormats: ["image/jpeg", "image/png", "image/webp"], supportedVideoFormats: ["video/mp4"], maxImageSizeBytes: 5 * 1024 * 1024, maxVideoSizeBytes: 50 * 1024 * 1024, maxVideoDurationSec: 300, maxCoverCount: 1, supportedContentTypes: ["article", "long-form"] },
    limits: { titleMaxLength: 200, bodyMaxLength: 100000, tagMaxCount: 10, imagesMaxCount: 100, videosMaxCount: 10 },
    riskLevel: "low", defaultMode: "draft",
    featureFlags: { realPublish: false, draft: true, contentLibrary: true }
  }
};
