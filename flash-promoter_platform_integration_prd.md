# flash-promoter 多平台对接与扩展架构 PRD

> 项目名称：flash-promoter  
> 模块名称：多平台对接与扩展架构 / Platform Integration Architecture  
> 文档类型：产品需求文档 / PRD  
> 版本：v1.0  
> 日期：2026-05-30  
> 核心目标：建立一套可扩展、可分级、可审计的平台对接体系，使 flash-promoter 能够从“内容包生成工具”进一步走向“多平台发布准备与受控发布工具”。

---

## 1. 背景

flash-promoter 的核心流程已经逐步形成：

```text
原始素材
→ AI 辅助填写
→ 平台内容包
→ 编辑确认
→ 发布前检查
→ 模拟发布 / 草稿 / 辅助发布 / 后续真实发布
```

下一阶段最关键的问题是：**如何对接不同平台**。

不同平台的开放能力差异非常大：

- 有些平台提供完整官方发布 API。
- 有些平台只提供视频、图文或草稿的部分能力。
- 有些平台只支持分享、复制、App 调起或网页辅助发布。
- 有些平台需要企业资质、创作者认证、应用审核或合作伙伴资格。
- 有些平台提交后进入审核，并不等于立即公开发布。
- 有些平台没有稳定公开发布 API，不能依赖非官方接口或抓包接口。

因此，flash-promoter 不能把所有平台都设计成“一键直发”。

正确设计应是：

```text
统一平台内容包
→ 平台能力识别
→ 按平台选择发布通道
→ 用户确认
→ 执行模拟 / 复制 / 辅助 / 草稿 / 提交 / 发布
→ 状态记录与审计
```

---

## 2. 设计结论

平台对接不应是“每个平台写一坨特殊代码”，而应采用可扩展插件体系：

```text
Platform Manifest
+ Platform Recipe
+ Auth Adapter
+ Asset Adapter
+ Publish Adapter
+ Status Adapter
+ Metrics Adapter
```

每个平台通过统一规范接入。

平台接入能力分为 5 层：

| 等级 | 名称 | 说明 |
|---|---|---|
| L0 | 模拟发布 | 不调用平台接口，只验证内容包、任务和日志 |
| L1 | 复制 / 分享 / 辅助打开 | 生成内容，辅助用户复制、打开 App 或网页 |
| L2 | 草稿 / 容器 / 待发布状态 | 创建草稿、上传容器、上传素材，不直接公开 |
| L3 | 官方 API 真实提交 | 调用官方接口提交内容，可能进入审核 |
| L4 | 发布后状态与数据回收 | 查询审核、链接、播放、阅读、点赞、评论等数据 |

一个平台可以只支持其中一部分，不要求全部支持。

---

## 3. 产品目标

### 3.1 核心目标

建立统一的平台对接框架，让 flash-promoter 可以稳定接入：

- 国内图文平台
- 国内视频平台
- 海外社交平台
- 海外视频平台
- 博客 / CMS 平台
- 去中心化社交平台
- 企业自有站点
- 未来未知平台

### 3.2 具体目标

1. 支持按平台能力分级接入。
2. 官方 API 优先。
3. 有草稿能力的平台优先走草稿。
4. 没有官方发布 API 的平台走辅助发布。
5. 支持图文、视频、图片、短文本、长文、轮播等内容类型。
6. 新增平台不修改核心流程。
7. 支持发布状态、错误、审核状态、外部链接记录。
8. 支持平台 API 变化时降级运行。
9. 支持真实发布前 dry-run 和二次确认。
10. 明确禁止隐藏接口、抓包接口和绕过风控。

---

## 4. 非目标

本阶段不做：

1. 不保证所有平台都能真实直发。
2. 不使用非公开隐藏接口作为核心能力。
3. 不绕过登录、验证码、风控或审核。
4. 不自动点击平台最终发布按钮。
5. 不默认公开发布。
6. 不把“提交成功”误判为“发布成功”。
7. 不为每个平台做不可维护的硬编码特殊流程。
8. 不把账号密码明文保存在本地。
9. 不把平台 Token 发送给 LLM。
10. 不绕开平台开放平台权限申请。

---

## 5. 平台调研总览

> 说明：平台接口能力变化较快，实际开发前必须再次核对官方文档、权限要求、账号类型、应用审核和接口限制。

### 5.1 国内平台

| 平台 | 内容形态 | 推荐接入等级 | 推荐策略 | 优先级 |
|---|---|---:|---|---|
| 微信公众号 | 图文、草稿、发布 | L2/L3/L4 | 官方 API，优先创建草稿，谨慎发布 | P0 |
| B站 | 视频、专栏、文章 | L2/L3/L4 | 官方开放平台，先模拟投稿与 dry-run，再真实投稿 | P0 |
| 小红书 | 图文、视频笔记 | L1/L2 | 分享开放平台 / App 辅助发布，避免承诺后台直发 | P0 |
| 知乎 | 文章、回答、视频说明 | L1 | 浏览器或复制辅助发布，不使用非官方接口 | P0 |
| 抖音 | 视频、图文 | L2/L3/L4 | 官方开放平台，视频/图文上传后创建内容，需权限 | P1 |
| 快手 | 视频、内容分享、挂载 | L2/L3 | 官方开放平台能力，依赖申请与场景 | P1 |
| 微博 | 短文本、图片、视频 | L2/L3 | 需核实当前 API 权限和审核要求 | P1 |
| 今日头条 / 头条号 | 图文、内容源 | L1/L2 | 优先 RSS / 内容源接入或辅助发布 | P2 |
| 百家号 | 图文、视频 | L1/L2 | 需核实官方发布能力，先按辅助/第三方集成预留 | P2 |
| CSDN | 技术博客 | L1 | 走辅助发布，不依赖抓包或 Cookie 自动化 | P2 |
| 掘金 | 技术文章 | L1 | 走辅助发布，不使用非官方 Web API | P2 |
| 简书 | 文章 | L1 | 辅助发布 | P3 |
| 知识星球 | 社群内容 | L1 | 复制 / 辅助发布 | P3 |

### 5.2 海外平台

| 平台 | 内容形态 | 推荐接入等级 | 推荐策略 | 优先级 |
|---|---|---:|---|---|
| YouTube | 视频、Shorts、元数据 | L3/L4 | 官方 Data API 上传视频与设置元数据 | P1 |
| Instagram | 图片、视频、Reels、Carousel | L2/L3/L4 | Graph API 容器式发布，依赖专业账号与权限 | P1 |
| Threads | 文本、图片、视频、轮播 | L3/L4 | Threads API 官方发布 | P1 |
| Facebook Pages | Page 文本、图片、视频 | L3/L4 | Pages API / Video API | P1 |
| X / Twitter | Post、图片、视频、Thread | L3/L4 | X API v2，注意付费与权限 | P1 |
| LinkedIn | 个人 / Page 动态 | L3/L4 | UGC / Share API，注意权限审核 | P1 |
| Pinterest | Pin、Board | L3/L4 | Pinterest API v5 创建 Pin | P2 |
| Reddit | Link / Self Post | L3 | Reddit API submit，需 subreddit 规则检查 | P2 |
| WordPress | 文章、页面、媒体 | L3/L4 | REST API，适合自建站与真实发布闭环验证 | P0/P1 |
| Medium | 文章、Publication | L3 | Medium API，适合长文同步 | P2 |
| Mastodon | Status、媒体、定时 | L3/L4 | Mastodon REST API | P2 |
| Bluesky | 短文本、图片 | L3/L4 | AT Protocol 创建记录 | P2 |
| Telegram Channel | 文本、图片、视频 | L3 | Bot API 发布到频道 | P2 |
| Discord | 消息、Webhook | L3 | Webhook / Bot API | P2 |
| Notion | 页面、数据库 | L2/L3 | 作为内容库 / 归档，不作为公开平台 | P3 |
| Ghost | 博客 | L3 | Admin API 发布文章 | P2 |
| Hashnode / Dev.to | 技术博客 | L2/L3 | 需逐个平台核实 GraphQL / API 权限 | P3 |

---

## 6. 平台接入策略分层

### 6.1 L0：模拟发布

适用于：

- 新平台开发前
- 平台 API 未配置
- 测试内容包结构
- 验证发布日志
- 验证发布任务

行为：

```text
创建 PublishJob
→ 校验内容包
→ 返回 simulated
→ 写入日志
```

不调用任何平台。

---

### 6.2 L1：复制 / 分享 / 辅助打开

适用于：

- 小红书
- 知乎
- 掘金
- CSDN
- 简书
- 头条号
- 百家号
- 其他没有稳定公开 API 的平台

行为：

```text
生成平台内容包
→ 一键复制字段
→ 打开平台网页 / App
→ 用户手动粘贴和发布
→ 记录辅助状态
```

状态不能写成“发布成功”，只能写：

```text
已复制
已打开平台
已辅助发布
用户手动完成
```

---

### 6.3 L2：草稿 / 容器 / 上传素材

适用于：

- 微信公众号草稿
- Instagram container
- WordPress draft
- 抖音视频上传后创建内容前状态
- B站上传 / 投稿前状态
- YouTube private / unlisted 上传

行为：

```text
上传素材
→ 创建草稿 / 容器
→ 返回外部 ID
→ 用户检查
→ 可选后续提交
```

L2 是真实接口接入的第一优先级。

---

### 6.4 L3：官方 API 真实提交

适用于官方文档明确支持发布的场景：

- B站视频 / 文章
- 抖音视频 / 图文
- YouTube 视频
- WordPress 文章
- Mastodon Status
- X Post
- Facebook Page Post
- Instagram Content Publishing
- Threads Post
- Pinterest Pin
- Reddit Post
- LinkedIn UGC Post

行为：

```text
发布前检查
→ 用户二次确认
→ 调用官方 API
→ 返回 submitted / published / reviewing
→ 写入日志
```

必须区分：

```text
已提交
审核中
已发布
发布失败
```

---

### 6.5 L4：发布后状态与数据回收

适用于：

- B站审核状态 / 数据
- YouTube 视频状态 / 数据
- 抖音视频状态 / 数据
- Instagram Insights
- Facebook Page Insights
- X Metrics
- LinkedIn Analytics
- WordPress permalink
- Mastodon Status URL

行为：

```text
定时查询
→ 更新外部状态
→ 写入 metrics
→ 展示发布结果
```

---

## 7. 优先级设计

### 7.1 P0：当前产品必须优先支持

| 平台 | 第一阶段目标 |
|---|---|
| 微信公众号 | 创建草稿，不默认发布 |
| B站 | 视频/专栏发布材料 + 模拟投稿；后续真实投稿 |
| 小红书 | 内容包 + 复制 / App 辅助 |
| 知乎 | 内容包 + 复制 / 浏览器辅助 |
| WordPress | 官方 REST API 创建草稿 / 文章 |

原因：

- 覆盖国内创作者核心图文 / 视频场景。
- WordPress 作为自有站点最稳定，适合先验证真实发布闭环。
- 微信公众号和 B站已有相对明确的官方能力。
- 小红书和知乎先做辅助，避免不合规直发。

---

### 7.2 P1：第二阶段扩展

| 平台 | 第一阶段目标 |
|---|---|
| 抖音 | 视频 / 图文官方上传与创建，需权限 |
| 快手 | 视频 / 分享能力，需权限申请 |
| YouTube | 视频上传与元数据 |
| Instagram | 图文 / Reels / Carousel |
| Threads | 文本 / 图片 / 视频发布 |
| Facebook Pages | Page 内容发布 |
| X | Post / Thread |
| LinkedIn | UGC Post |

---

### 7.3 P2：第三阶段扩展

| 平台 | 接入方式 |
|---|---|
| Pinterest | Pin 发布 |
| Reddit | Subreddit 发帖 |
| Medium | 文章发布 |
| Mastodon | Status 发布 |
| Bluesky | AT Protocol 发帖 |
| Telegram | Bot 发频道消息 |
| Discord | Webhook / Bot 发送内容 |
| Ghost | Admin API 发文 |

---

### 7.4 P3：辅助或待确认平台

| 平台 | 接入方式 |
|---|---|
| 今日头条 / 头条号 | RSS / 内容源 / 辅助发布 |
| 百家号 | 辅助发布 / 需确认官方开放能力 |
| CSDN | 辅助发布 |
| 掘金 | 辅助发布 |
| 简书 | 辅助发布 |
| 豆瓣 | 辅助发布 |
| 知识星球 | 辅助发布 |

---

## 8. 平台能力矩阵

| 平台 | 短文本 | 长文 | 图文 | 视频 | 轮播 | 草稿/容器 | 状态回查 |
|---|---|---|---|---|---|---|---|
| 微信公众号 | 否 | 是 | 是 | 有限 | 否 | 是 | 是 |
| B站 | 否 | 是 | 是 | 是 | 否 | 部分 | 是 |
| 小红书 | 是 | 有限 | 是 | 是 | 是 | App 侧 | 有限 |
| 知乎 | 是 | 是 | 是 | 有限 | 否 | Web 侧 | 有限 |
| 抖音 | 是 | 否 | 是 | 是 | 是 | 容器/上传 | 是 |
| 快手 | 是 | 否 | 是 | 是 | 否 | 依能力 | 是 |
| 微博 | 是 | 有限 | 是 | 是 | 是 | 否 | 是 |
| YouTube | 否 | 否 | 否 | 是 | Shorts | 隐私状态 | 是 |
| Instagram | 是 | 否 | 是 | 是 | 是 | 容器 | 是 |
| Threads | 是 | 否 | 是 | 是 | 是 | 否 | 是 |
| Facebook Pages | 是 | 是 | 是 | 是 | 是 | 部分 | 是 |
| X | 是 | 否 | 是 | 是 | Thread | 否 | 是 |
| LinkedIn | 是 | 是 | 是 | 是 | 文档有限 | 否 | 是 |
| Pinterest | 否 | 否 | 是 | 是 | Pin | 否 | 是 |
| Reddit | 是 | 是 | 链接/图 | 视频有限 | 否 | 否 | 是 |
| WordPress | 否 | 是 | 是 | 嵌入/媒体 | 否 | 是 | 是 |
| Medium | 否 | 是 | 是 | 嵌入 | 否 | 部分 | 有限 |
| Mastodon | 是 | 否 | 是 | 是 | 否 | 定时 | 是 |
| Bluesky | 是 | 否 | 是 | 有限 | 否 | 否 | 是 |

---

## 9. 核心架构设计

### 9.1 总体架构

```text
PlatformContentPackage
→ PlatformRecipe
→ PlatformManifest
→ PlatformAdapter
  → AuthAdapter
  → AssetAdapter
  → PublishAdapter
  → StatusAdapter
  → MetricsAdapter
→ PublishJob
→ PublishLog
```

---

### 9.2 PlatformManifest

每个平台必须有 Manifest。

```ts
type PlatformManifest = {
  id: PlatformId;
  name: string;
  region: "cn" | "global";
  homepage: string;
  docs?: string[];
  supportedContentTypes: ContentType[];
  supportedPackageTypes: string[];
  publishLevels: PublishLevel[];
  auth: AuthManifest;
  assets: AssetManifest;
  limits: PlatformLimits;
  riskLevel: "low" | "medium" | "high";
  defaultMode: PublishMode;
  featureFlags: Record<string, boolean>;
};
```

---

### 9.3 PublishLevel

```ts
type PublishLevel =
  | "simulate"
  | "copy"
  | "share"
  | "assist"
  | "draft"
  | "container"
  | "submit"
  | "publish"
  | "status"
  | "metrics";
```

---

### 9.4 PlatformAdapter

```ts
interface PlatformAdapter {
  manifest: PlatformManifest;

  validatePackage(pkg: PlatformContentPackage): Promise<ValidationResult>;

  prepareAssets?(
    pkg: PlatformContentPackage,
    account: PlatformAccount
  ): Promise<PreparedAssets>;

  createDraft?(
    pkg: PlatformContentPackage,
    account: PlatformAccount
  ): Promise<PlatformDraftResult>;

  submit?(
    pkg: PlatformContentPackage,
    account: PlatformAccount,
    options: SubmitOptions
  ): Promise<PlatformSubmitResult>;

  publish?(
    pkg: PlatformContentPackage,
    account: PlatformAccount,
    options: PublishOptions
  ): Promise<PlatformPublishResult>;

  getStatus?(
    externalId: string,
    account: PlatformAccount
  ): Promise<PlatformStatusResult>;

  getMetrics?(
    externalId: string,
    account: PlatformAccount
  ): Promise<PlatformMetricsResult>;
}
```

---

## 10. 统一发布模式

### 10.1 PublishMode

```ts
type PublishMode =
  | "simulate"
  | "copy"
  | "share"
  | "assist"
  | "draft"
  | "submit"
  | "publish";
```

### 10.2 模式解释

| 模式 | 用户文案 | 含义 |
|---|---|---|
| simulate | 模拟发布 | 不调用平台 |
| copy | 复制内容 | 复制标题、正文、标签等 |
| share | 系统分享 | 调用系统分享面板 |
| assist | 辅助发布 | 打开平台页面 / App，用户手动发布 |
| draft | 创建草稿 | 创建平台草稿 |
| submit | 提交审核 | 调用官方接口提交，可能进入审核 |
| publish | 公开发布 | 直接公开发布，必须二次确认 |

---

## 11. 账号与凭证设计

### 11.1 AuthType

```ts
type AuthType =
  | "none"
  | "oauth2"
  | "oauth1"
  | "api-key"
  | "app-secret"
  | "bot-token"
  | "webhook"
  | "manual";
```

### 11.2 PlatformAccount

```ts
type PlatformAccount = {
  id: string;
  platform: PlatformId;
  displayName: string;
  authType: AuthType;
  encryptedCredentials: string;
  scopes: string[];
  expiresAt?: number;
  status: "active" | "expired" | "invalid" | "disabled";
  createdAt: number;
  updatedAt: number;
};
```

### 11.3 凭证安全要求

1. 所有凭证必须加密保存。
2. 前端不显示完整 token。
3. 日志不记录 token。
4. LLM 不接触平台凭证。
5. 用户可删除授权。
6. 真实发布前必须检查授权范围。
7. OAuth token 过期必须可刷新或提示重新授权。

---

## 12. 内容包到平台字段映射

### 12.1 FieldMapping

```ts
type FieldMapping = {
  packageType: string;
  platform: PlatformId;
  slots: {
    slotKey: string;
    platformField: string;
    required: boolean;
    transform?: string;
    maxLength?: number;
  }[];
};
```

### 12.2 示例：B站视频

```ts
{
  packageType: "bilibili-video",
  platform: "bilibili",
  slots: [
    { slotKey: "title", platformField: "title", required: true, maxLength: 80 },
    { slotKey: "description", platformField: "desc", required: true },
    { slotKey: "tags", platformField: "tag", required: true },
    { slotKey: "partitionSuggestion", platformField: "tid", required: true },
    { slotKey: "cover", platformField: "cover", required: true }
  ]
}
```

---

## 13. 资产处理设计

### 13.1 资产类型

```ts
type AssetType =
  | "image"
  | "video"
  | "cover"
  | "thumbnail"
  | "audio"
  | "subtitle"
  | "document";
```

### 13.2 资产处理流程

```text
本地资产
→ 格式校验
→ 尺寸 / 时长 / 大小读取
→ 平台规格校验
→ 必要时转为平台要求格式
→ 上传到平台
→ 获得 platformAssetId
→ 写入 PreparedAssets
```

### 13.3 PreparedAssets

```ts
type PreparedAssets = {
  platform: PlatformId;
  assets: {
    localAssetId: string;
    platformAssetId?: string;
    platformUrl?: string;
    usage: "cover" | "body" | "video" | "thumbnail" | "attachment";
    status: "prepared" | "uploaded" | "failed";
  }[];
};
```

---

## 14. 发布任务设计

### 14.1 PublishJob

```ts
type PublishJob = {
  id: string;
  contentId: string;
  packageId: string;
  platform: PlatformId;
  accountId?: string;
  mode: PublishMode;
  level: PublishLevel;
  status: PublishJobStatus;
  externalId?: string;
  externalUrl?: string;
  reviewStatus?: string;
  errorCode?: string;
  errorMessage?: string;
  createdAt: number;
  updatedAt: number;
};
```

### 14.2 PublishJobStatus

```ts
type PublishJobStatus =
  | "pending"
  | "validating"
  | "asset_preparing"
  | "ready"
  | "copied"
  | "assist_opened"
  | "draft_created"
  | "submitted"
  | "reviewing"
  | "published"
  | "failed"
  | "cancelled";
```

---

## 15. 发布前安全机制

### 15.1 全局真实发布开关

配置：

```env
REAL_PUBLISH_ENABLED=false
```

平台级配置：

```env
WECHAT_REAL_DRAFT_ENABLED=false
BILIBILI_REAL_SUBMIT_ENABLED=false
DOUYIN_REAL_SUBMIT_ENABLED=false
YOUTUBE_REAL_UPLOAD_ENABLED=false
```

### 15.2 二次确认

所有 L3/L4 行为必须二次确认：

```text
你即将调用官方接口提交内容到平台。
该操作可能产生公开内容或审核任务。
请确认继续。
```

### 15.3 Dry Run

所有官方 API adapter 必须支持 dry run：

```text
检查账号
检查权限
检查内容字段
检查资产
检查将调用的接口
不真正提交
```

---

## 16. 各平台接入方案

### 16.1 微信公众号

支持能力：

- 图文素材
- 正文图片上传
- 永久素材
- 草稿
- 发布草稿
- 发布状态查询

推荐阶段：

```text
第一阶段：创建草稿
第二阶段：发布草稿
第三阶段：状态查询
```

注意事项：

- 需要 AppID / AppSecret。
- 需要 access_token。
- 可能需要 IP 白名单。
- 正文图片需要上传到公众号可用地址。
- 默认不直接发布。

平台模式：

```text
draft 优先
publish 后续显式开启
```

---

### 16.2 B站

支持能力：

- 视频上传
- 分片上传
- 合片
- 封面上传
- 视频稿件提交
- 文章 / 专栏提交
- 审核状态

推荐阶段：

```text
第一阶段：视频发布材料 + 模拟投稿
第二阶段：小文件上传测试
第三阶段：真实投稿提交
第四阶段：审核状态查询
```

注意事项：

- 投稿成功不等于发布成功。
- 标题、标签、分区都需要校验。
- 视频上传和投稿提交应拆成独立步骤。

---

### 16.3 小红书

支持能力判断：

- 官方分享开放平台提供“一键分享”“快速发布”等能力。
- 普通创作者后台直发 API 不应作为默认假设。
- 适合移动端 App 调起或辅助发布。

推荐阶段：

```text
第一阶段：内容包 + 复制
第二阶段：移动端分享 / 打开 App
第三阶段：对接分享开放平台
```

平台模式：

```text
assist / share
```

---

### 16.4 知乎

支持能力判断：

- 不将知乎纳入官方直发平台。
- 只做辅助发布。
- 不使用非官方 API。

推荐阶段：

```text
复制标题 / 正文 / 话题
打开知乎发布页
用户手动发布
```

平台模式：

```text
assist
```

---

### 16.5 抖音

支持能力：

- 视频上传
- 分片上传
- 图文图片上传
- 创建视频
- 查询视频发布结果
- 需要用户授权和平台权限

推荐阶段：

```text
第一阶段：视频 / 图文内容包
第二阶段：上传视频 dry run
第三阶段：真实视频上传测试
第四阶段：创建视频并查询状态
```

注意事项：

- 大视频需要分片。
- 创建视频后存在审核过程。
- 权限路径和账号资质需要提前确认。

---

### 16.6 快手

支持能力：

- 内容分享
- 视频上传 / 分片上传能力
- 快手开放平台 / 小程序能力
- 权限与应用类型高度相关

推荐阶段：

```text
第一阶段：视频内容包 + 辅助发布
第二阶段：申请开放平台能力
第三阶段：真实上传测试
```

---

### 16.7 YouTube

支持能力：

- 视频上传
- 视频元数据设置
- 播放列表
- 状态查询
- 数据回收

推荐阶段：

```text
第一阶段：YouTube 视频内容包
第二阶段：OAuth 授权
第三阶段：上传为 private/unlisted
第四阶段：查询视频 URL 和状态
```

---

### 16.8 Instagram

支持能力：

- 单图
- 视频
- Reels
- Carousel
- 内容发布容器
- Insights

推荐阶段：

```text
第一阶段：Instagram 内容包
第二阶段：创建 media container
第三阶段：publish container
第四阶段：状态 / insights
```

注意事项：

- 通常需要 Business / Creator 账号。
- 需要 Graph API 权限。
- 发布流程是容器式。

---

### 16.9 Threads

支持能力：

- 文本
- 图片
- 视频
- 轮播
- 官方 API 发布

推荐阶段：

```text
第一阶段：Threads 文本 / 图片
第二阶段：视频 / 轮播
第三阶段：状态回查
```

---

### 16.10 Facebook Pages

支持能力：

- Page Post
- 图片
- 视频
- 评论管理
- Insights

推荐阶段：

```text
第一阶段：Page 文本 / 图片
第二阶段：视频
第三阶段：Insights
```

---

### 16.11 X

支持能力：

- Post
- Reply
- Thread
- 媒体上传
- 删除 / 编辑部分能力
- 指标数据，依权限

推荐阶段：

```text
第一阶段：短文本 / Thread
第二阶段：图片
第三阶段：视频
第四阶段：Metrics
```

注意事项：

- API 可能涉及付费。
- 速率和权限需要重点处理。

---

### 16.12 LinkedIn

支持能力：

- 个人动态
- 组织 Page
- 图片 / 视频
- UGC Post

推荐阶段：

```text
第一阶段：个人文本 / 链接
第二阶段：图片 / 视频
第三阶段：组织 Page
```

注意事项：

- 权限审核和 API Terms 较严格。
- 企业使用需关注合规。

---

### 16.13 Pinterest

支持能力：

- 创建 Pin
- Board 管理
- 图片 / 视频 Pin
- 数据回收

推荐阶段：

```text
第一阶段：图片 Pin
第二阶段：视频 Pin
第三阶段：Board 管理
```

---

### 16.14 Reddit

支持能力：

- Link Post
- Self Post
- Subreddit 发帖
- 评论 / 状态

推荐阶段：

```text
第一阶段：Self Post / Link Post
第二阶段：subreddit 规则预检查
第三阶段：媒体能力
```

注意事项：

- 每个 subreddit 规则不同。
- 必须让用户选择社区和 flair。
- 不能只按平台级校验。

---

### 16.15 WordPress

支持能力：

- 创建草稿
- 发布文章
- 上传媒体
- 更新文章
- 获取 permalink

推荐阶段：

```text
第一阶段：创建 draft
第二阶段：发布文章
第三阶段：媒体上传
第四阶段：更新文章
```

WordPress 是最适合验证真实发布闭环的平台之一。

---

### 16.16 Medium

支持能力：

- 创建用户文章
- 创建 publication 文章
- Markdown / HTML 内容

推荐阶段：

```text
第一阶段：文章发布
第二阶段：Publication 发布
```

---

### 16.17 Mastodon

支持能力：

- 发布 status
- 媒体附件
- 可见性
- 定时发布
- 状态查询

推荐阶段：

```text
第一阶段：文本 status
第二阶段：媒体
第三阶段：定时
```

---

### 16.18 Bluesky

支持能力：

- AT Protocol JSON Record
- 发帖
- 图片
- 去中心化身份

推荐阶段：

```text
第一阶段：文本发帖
第二阶段：图片
第三阶段：回复 / 引用
```

---

### 16.19 Telegram / Discord

这类更像“频道 / 社群分发”，不是传统内容平台。

Telegram：

```text
Bot API → 发送到 Channel / Group
```

Discord：

```text
Webhook / Bot API → 发送到 Channel
```

适合：

- 发布通知
- 内容摘要
- 外链分发
- 社群同步

---

## 17. 未规划平台新增方案

当遇到新平台时，不允许直接硬编码。必须走以下流程。

### 17.1 第一步：平台能力调研

填写 Platform Research Card：

```ts
type PlatformResearchCard = {
  platformName: string;
  officialDocs?: string[];
  supportsOfficialApi: boolean;
  supportsOAuth: boolean;
  supportsDraft: boolean;
  supportsMediaUpload: boolean;
  supportsVideo: boolean;
  supportsStatusQuery: boolean;
  supportsMetrics: boolean;
  requiresBusinessAccount: boolean;
  requiresReview: boolean;
  apiRisk: "low" | "medium" | "high";
  recommendedLevel: PublishLevel[];
  notes: string[];
};
```

输出结论：

```text
Direct API / Draft API / Share / Assist / Not supported
```

---

### 17.2 第二步：选择接入模式

按以下规则选择：

| 条件 | 接入模式 |
|---|---|
| 有官方发布 API | L3 |
| 有官方草稿 / 容器 API | L2 |
| 只有分享 / 调起能力 | L1 |
| 没有官方能力但有网页发布 | L1 assist |
| 只有非官方隐藏接口 | 不接 |
| 需要合作伙伴资格 | 预留 manifest，默认禁用 |

---

### 17.3 第三步：定义平台配方

新增 PlatformRecipe：

```ts
const newPlatformRecipe = {
  platform: "new-platform",
  contentType: "article",
  packageType: "new-platform-article",
  requiredSlots: [],
  optionalSlots: [],
  styleRules: [],
  validationRules: []
}
```

---

### 17.4 第四步：定义 Manifest

新增：

```text
packages/adapters/new-platform/manifest.ts
```

包含：

- 平台 ID
- 平台名称
- 支持内容类型
- 支持发布等级
- 授权方式
- 文档链接
- 默认模式
- 风险等级

---

### 17.5 第五步：实现 Adapter

新增：

```text
packages/adapters/new-platform/
  manifest.ts
  recipe.ts
  validator.ts
  adapter.ts
  assets.ts
  auth.ts
  tests/
```

必须先实现：

```text
simulate
validatePackage
```

再考虑：

```text
draft
submit
publish
status
metrics
```

---

### 17.6 第六步：前端自动接入

平台不应要求前端写大量特殊逻辑。

前端通过 Manifest 和 Recipe 自动渲染：

- 平台卡片
- 内容包字段
- AI 辅助按钮
- 校验结果
- 发布模式
- 操作按钮

只有特别复杂的平台才允许自定义 UI。

---

### 17.7 第七步：测试

每个新平台必须有：

1. Manifest 测试。
2. Recipe 测试。
3. Slot 映射测试。
4. Validator 测试。
5. Simulate 测试。
6. Dry-run 测试。
7. 错误处理测试。
8. 不泄露 token 测试。

---

## 18. 平台接入 UI 设计

### 18.1 平台管理页

设置页新增：

```text
平台接入管理
```

显示：

- 平台名称
- 当前状态
- 支持能力
- 默认模式
- 是否已授权
- 是否允许真实提交
- 文档链接
- 测试连接

状态：

```text
未配置
已配置
授权过期
仅辅助发布
仅模拟
可创建草稿
可提交审核
可真实发布
```

---

### 18.2 平台详情页

字段：

- 平台 Logo
- 平台说明
- 支持内容类型
- 支持发布模式
- 授权方式
- 当前账号
- 权限范围
- 最后测试时间
- 风险提示
- 启用 / 禁用开关

---

### 18.3 发布前确认页

真实提交前显示：

```text
平台：B站
模式：提交审核
内容类型：视频
账号：xxx
将上传：1 个视频，1 张封面
将提交：标题、简介、标签、分区、封面
提交后可能进入审核状态，并不代表立即公开发布。
```

用户点击：

```text
确认提交
```

---

## 19. 风险与降级策略

### 19.1 API 失效

如果官方 API 变更或权限失效：

```text
L3 → L2 → L1 → L0
```

例如：

```text
真实发布失败
→ 尝试创建草稿
→ 生成复制内容
→ 模拟发布
```

### 19.2 授权过期

处理：

- 标记账号 expired。
- 禁用真实发布按钮。
- 提示重新授权。
- 保留模拟发布和复制辅助能力。

### 19.3 审核失败

处理：

- 展示平台错误原因。
- 不自动重发。
- 允许用户回到编辑页修改。
- 写入日志。

### 19.4 平台限流

处理：

- 记录 rate limit。
- 支持重试时间。
- 禁止快速重复提交。
- 显示平台限流提示。

---

## 20. 日志与审计

### 20.1 PublishLog

必须记录：

- 平台
- 账号
- 内容包
- 发布模式
- 调用阶段
- 外部 ID
- 外部 URL
- 状态
- 错误码
- 错误信息
- 脱敏请求摘要
- 脱敏响应摘要
- 创建时间

### 20.2 禁止记录

- access_token
- refresh_token
- app_secret
- api_key
- cookie
- 明文账号密码
- 未脱敏请求头

---

## 21. 数据库建议

### 21.1 platform_manifests

```sql
CREATE TABLE IF NOT EXISTS platform_manifests (
  id TEXT PRIMARY KEY,
  platform TEXT NOT NULL,
  manifest_json TEXT NOT NULL,
  enabled INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```

### 21.2 platform_accounts

```sql
CREATE TABLE IF NOT EXISTS platform_accounts (
  id TEXT PRIMARY KEY,
  platform TEXT NOT NULL,
  display_name TEXT NOT NULL,
  auth_type TEXT NOT NULL,
  encrypted_credentials TEXT NOT NULL,
  scopes_json TEXT,
  expires_at INTEGER,
  status TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```

### 21.3 prepared_assets

```sql
CREATE TABLE IF NOT EXISTS prepared_assets (
  id TEXT PRIMARY KEY,
  platform TEXT NOT NULL,
  local_asset_id TEXT NOT NULL,
  platform_asset_id TEXT,
  platform_url TEXT,
  usage TEXT NOT NULL,
  status TEXT NOT NULL,
  raw_json TEXT,
  created_at INTEGER NOT NULL
);
```

### 21.4 platform_publish_records

```sql
CREATE TABLE IF NOT EXISTS platform_publish_records (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  external_id TEXT,
  external_url TEXT,
  status TEXT NOT NULL,
  review_status TEXT,
  metrics_json TEXT,
  raw_json TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```

---

## 22. 验收标准

### 22.1 平台架构验收

1. 平台能力通过 Manifest 描述。
2. 平台字段通过 Recipe 描述。
3. 新平台不需要修改核心发布流程。
4. 前端能根据 Manifest 自动展示平台能力。
5. 未授权平台不会显示真实发布按钮。
6. 所有平台至少支持 simulate。
7. 所有真实发布前支持 dry run。
8. 所有真实发布前需要二次确认。

### 22.2 P0 平台验收

#### 微信公众号

- 可配置账号。
- 可测试 access_token。
- 可上传封面。
- 可创建草稿。
- 默认不直接发布。
- 日志脱敏。

#### B站

- 可生成视频 / 专栏发布材料。
- 可校验标题、简介、标签、分区。
- 可模拟投稿。
- 真实投稿接口预留但默认关闭。

#### 小红书

- 可生成图文 / 视频内容包。
- 可复制标题、正文、话题。
- 可打开辅助发布入口。
- 不声称真实发布成功。

#### 知乎

- 可生成文章 / 回答内容包。
- 可复制标题、正文、话题。
- 可打开辅助发布入口。
- 不使用非官方接口。

#### WordPress

- 可配置站点。
- 可创建草稿。
- 可发布文章，需显式启用。
- 可记录 permalink。

### 22.3 新平台接入验收

1. 新增平台 Manifest。
2. 新增 PlatformRecipe。
3. 新增 Validator。
4. 至少支持 simulate。
5. 如果支持 API，必须实现 dry run。
6. 前端可展示该平台。
7. 发布记录可显示该平台。
8. 错误日志可记录该平台。
9. 不泄露任何凭证。

---

## 23. 开发建议顺序

### 23.1 第一阶段：平台框架

- PlatformManifest
- PlatformRecipe
- PlatformAdapter v2
- PlatformAccount
- PublishMode 分级
- Dry run
- 平台管理页

### 23.2 第二阶段：P0 平台

- 微信公众号 draft
- B站 simulate + dry-run skeleton
- 小红书 assist
- 知乎 assist
- WordPress draft / publish

### 23.3 第三阶段：P1 平台

- 抖音
- 快手
- YouTube
- Instagram
- Threads
- Facebook Pages
- X
- LinkedIn

### 23.4 第四阶段：P2 / P3 平台

- Pinterest
- Reddit
- Medium
- Mastodon
- Bluesky
- Telegram
- Discord
- CSDN / 掘金 / 简书等辅助发布

---

## 24. 调研依据与参考链接

### 国内平台

- 微信公众号草稿 / 发布相关官方文档入口：  
  https://developers.weixin.qq.com/doc/offiaccount/Draft_Box/Add_draft.html  
  https://developers.weixin.qq.com/doc/offiaccount/Publish/Publish.html

- B站开放平台视频分片上传：  
  https://open.bilibili.com/doc/4/733a520a-c50f-7bb4-17cb-35338ba20500

- B站开放平台文章提交：  
  https://open.bilibili.com/doc/4/b14b77b6-8889-8c8b-2e83-17c5a4c550fb

- 小红书分享开放平台：  
  https://agora.xiaohongshu.com/

- 抖音开放平台上传视频：  
  https://developer.open-douyin.com/docs/resource/zh-CN/dop/develop/openapi/video-management/douyin/create-video/upload-video

- 抖音开放平台创建视频：  
  https://developer.open-douyin.com/docs/resource/zh-CN/dop/develop/openapi/video-management/douyin/create-video/video-create

- 快手开放平台：  
  https://open.kuaishou.com/

- 快手开放平台上传视频：  
  https://open.kuaishou.com/platform/openApi?menu=20

- 今日头条内容源接入：  
  https://mp.toutiao.com/docs/baike/2789/20623/

### 海外平台

- YouTube Data API videos.insert：  
  https://developers.google.com/youtube/v3/docs/videos/insert

- Instagram Content Publishing：  
  https://developers.facebook.com/docs/instagram-platform/content-publishing/

- Threads API Posts：  
  https://developers.facebook.com/docs/threads/posts/

- Facebook Pages API Posts：  
  https://developers.facebook.com/docs/pages-api/posts/

- X API Create Post：  
  https://docs.x.com/x-api/posts/create-post

- LinkedIn UGC Post API：  
  https://learn.microsoft.com/en-us/linkedin/compliance/integrations/shares/ugc-post-api

- Pinterest API Create Pin：  
  https://developers.pinterest.com/docs/api/v5/pins-create/

- Reddit API submit：  
  https://www.reddit.com/dev/api/

- WordPress REST API Posts：  
  https://developer.wordpress.org/rest-api/reference/posts/

- Medium API docs：  
  https://github.com/Medium/medium-api-docs

- Mastodon Status API：  
  https://docs.joinmastodon.org/methods/statuses/

- AT Protocol / Bluesky：  
  https://atproto.com/  
  https://docs.bsky.app/docs/advanced-guides/posts

---

## 25. 总结

flash-promoter 的平台对接体系不应追求“所有平台一键直发”，而应追求：

```text
能直连的走官方 API
能草稿的先草稿
能分享的走分享
不能直连的走辅助
任何平台都能模拟
所有行为都可审计
```

最终目标是建立一套可持续扩展的平台连接架构，使新增平台时只需要新增：

```text
Manifest
Recipe
Validator
Adapter
Auth
Asset
Status
Tests
```

而不需要重写主流程。

平台对接的核心原则是：

```text
官方优先
草稿优先
辅助可用
真实发布谨慎开启
隐藏接口禁止使用
未规划平台按标准流程新增
```
