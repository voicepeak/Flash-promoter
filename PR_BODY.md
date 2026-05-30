## PR: Implement Issue #17 — 多平台对接与扩展架构

Closes #17

### 概述

按 Issue #17 PRD 完整实现 flash-promoter 多平台扩展架构，建立统一平台对接框架。核心思路：不把每个平台写成一坨特殊代码，而是采用可扩展插件体系——PlatformManifest + PlatformAdapter + Sub-Adapters + FieldMapping + Dry Run + CredentialVault。

---

### 一、核心架构

#### 1.1 统一平台接入流程

```
原始素材 → AI 辅助填写 → 平台内容包 → 编辑确认
→ 发布前检查 → 按平台能力分层发布
→ 模拟 / 复制 / 分享 / 辅助 / 草稿 / 提交 / 真实发布
→ 状态记录与审计
```

#### 1.2 能力分层 L0-L4

| Level | 名称 | 说明 | 实现 |
|---|---|---|---|
| L0 | 模拟发布 | 不调用平台接口，仅验证内容、任务和日志 | ✅ |
| L1 | 复制/分享/辅助打开 | 生成内容，辅助用户复制、打开 App 或网页 | ✅ |
| L2 | 草稿/容器/上传 | 创建草稿、上传容器、上传素材，不直接公开 | ✅ |
| L3 | 官方 API 真实提交 | 调用官方接口提交，可能进入审核 | ✅ 接口就绪 |
| L4 | 发布后状态与数据回收 | 查询审核、链接、播放、阅读等数据 | ✅ 接口就绪 |

#### 1.3 新 PlatformAdapter 接口

```ts
interface PlatformAdapter {
  manifest: PlatformManifest;
  validatePackage(draft): Promise<ValidationResult>;
  validate(draft): Promise<ValidationResult>;
  transform(input, options): Promise<PlatformDraft>;
  prepareAssets?(draft, account): Promise<PreparedAssets>;
  createDraft?(draft, account): Promise<PlatformDraftResult>;
  submit?(draft, account, options): Promise<PlatformSubmitResult>;
  publish(draft, account, mode, options?): Promise<PublishResult>;
  getStatus?(externalId, account): Promise<PlatformStatusResult>;
  getMetrics?(externalId, account): Promise<PlatformMetricsResult>;
  dryRun?(draft, account, mode): Promise<DryRunReport>;
  fieldMappings?: FieldMapping[];
  auth?: AuthAdapter;
  assets?: AssetAdapter;
  status?: StatusAdapter;
  metrics?: MetricsAdapter;
}
```

---

### 二、新增模块一览

| 模块 | 文件 | 说明 |
|---|---|---|
| **PlatformManifest** | `adapters/manifests.ts` | 29 个平台完整能力声明，含 publishLevels/auth/assets/limits/riskLevel/defaultMode/featureFlags |
| **FieldMapping** | `adapters/field-mapping.ts` | 18 组平台字段映射，含 `applyFieldMapping` / `validateFieldMapping` |
| **PlatformRecipe** | `models.ts` | TransformRule + AssetConstraint + PublishStrategy |
| **PlatformContentPackage** | `models.ts` | 统一平台内容包，含 mappedFields/recipeId |
| **WordPress Adapter** | `adapters/wordpress.ts` | P0 新增，支持 draft/publish + dryRun |
| **CredentialVault** | `security/vault.ts` | AES-256-GCM 加密，持久化 salt，密码验证，changePassword |
| **BrowserAssist** | `browser/assist.ts` | 8 平台完整 instructions，`fillFields()` 模拟填充，`createBrowserAssistPackage()` |
| **Sub-Adapters** | `adapters/types.ts` | AuthAdapter / AssetAdapter / StatusAdapter / MetricsAdapter |

---

### 三、平台覆盖

#### P0（已实现适配器）

| 平台 | 模式 | PublishLevel |
|---|---|---|
| 微信公众号 | draft（草稿优先） | L0 / L2 |
| B站 | simulate（模拟投稿） | L0 |
| 小红书 | assist / copy / share | L0 / L1 |
| 知乎 | assist / copy | L0 / L1 |
| **WordPress** | **draft（新增）** | **L0 / L2** |

#### P1-P3（Manifest 已定义，随时接入）

| 优先级 | 平台列表 |
|---|---|
| P1 | 抖音、快手、YouTube、Instagram、Threads、Facebook Pages、X/Twitter、LinkedIn |
| P2 | Pinterest、Reddit、Medium、Mastodon、Bluesky、Telegram Channel、Discord、Ghost |
| P3 | 今日头条、百家号、CSDN、掘金、简书、豆瓣、Notion |

---

### 四、安全机制

| 机制 | 文件 | 说明 |
|---|---|---|
| CredentialVault | `security/vault.ts` | AES-256-GCM + scrypt 密钥派生 + 持久化 salt + 密码签名验证 |
| changePassword | `vault.ts` | 支持用旧密码解锁后重加密全部凭证 |
| Dry Run | `common.ts` (`performDryRun`) | 检查：账号有效 → 权限 OK → 内容校验通过 → 资产就绪 → 列出将调用的 API |
| REAL_PUBLISH_ENABLED | `common.ts` | `setRealPublishEnabled()` 全局开关 + `setPlatformRealPublishEnabled()` 平台级开关 |
| enforceNoDirectPublish | `common.ts` | MVP 阶段所有 L3 行为被阻止，返回 `publish_disabled_in_mvp` |
| 二次确认 | `app.ts` | `publish` / `submit` 模式需 `confirmed: true` |
| manual-only | 所有 assist 适配器 | `finalPublishAction: "manual-only"` |

---

### 五、API 端点新增

#### 平台账号管理
```
POST   /api/accounts              # 创建平台账号（含加密凭证）
GET    /api/accounts              # 列出所有账号（凭证脱敏）
GET    /api/accounts/:id          # 查询单个账号
PUT    /api/accounts/:id          # 更新账号/scopes/状态
DELETE /api/accounts/:id          # 删除账号
```

#### 独立发布层级端点
```
POST   /api/drafts/:id/create-draft   # 创建平台草稿（L2）
POST   /api/drafts/:id/submit         # 提交审核（L3）
POST   /api/drafts/:id/prepare-assets # 准备并上传资产
POST   /api/drafts/:id/dry-run        # 发布前预检（Dry Run）
GET    /api/drafts/:id/status         # 查询发布状态（L4）
GET    /api/drafts/:id/metrics        # 查询数据指标（L4）
```

---

### 六、数据库 Schema 变更

- `accounts` 表：`scopes` → `scopes_json` TEXT（支持 JSON 数组）
- `assets` 表：新增 `data_url`、`filename` 列
- `publish_jobs` 表：新增 `draft_id`、`account_id`、`level`、`external_id`、`external_url`、`review_status`、`error_code`

---

### 七、字段映射示例

**B站视频：**
```json
{
  "packageType": "bilibili-video",
  "platform": "bilibili",
  "slots": [
    { "slotKey": "title", "platformField": "title", "required": true, "maxLength": 80 },
    { "slotKey": "description", "platformField": "desc", "required": true },
    { "slotKey": "tags", "platformField": "tag", "required": true },
    { "slotKey": "partitionSuggestion", "platformField": "tid", "required": true },
    { "slotKey": "cover", "platformField": "cover", "required": true }
  ]
}
```

**微信公众号：**
```json
{
  "packageType": "wechat-article",
  "platform": "wechat",
  "slots": [
    { "slotKey": "title", "platformField": "title", "required": true, "maxLength": 64 },
    { "slotKey": "bodyMarkdown", "platformField": "content", "required": true },
    { "slotKey": "summary", "platformField": "digest", "required": false, "maxLength": 120 }
  ]
}
```

已覆盖 18 组映射：bilibili-video、wechat-article、wordpress-post、xhs-note、zhihu-article、youtube-video、twitter-post、douyin-video、instagram-container、linkedin-post、facebook-post、medium-article、mastodon-status、reddit-post、telegram-message、discord-message、ghost-post、notion-page。

---

### 八、改造的现有文件

| 文件 | 变更 |
|---|---|
| `models.ts` | 新增 12 个类型，扩展 PlatformId/PublishMode/PublishStatus/PublishJob |
| `adapters/types.ts` | PlatformAdapter 从 3 方法扩展到 10+ 方法 + 4 个 Sub-Adapter |
| `adapters/registry.ts` | 增加 listManifests / getManifest |
| `adapters/common.ts` | 新增 performDryRun / REAL_PUBLISH_ENABLED / copiedResult / assistOpenedResult / defaultPublishOptions |
| `adapters/{mock,wechat,bilibili,zhihu,xhs}.ts` | 全部增加 manifest/dryRun/validatePackage |
| `adapters/index.ts` | 注册 WordPress 适配器 |
| `core/index.ts` | 导出 browser/field-mapping/manifests 模块 |
| `pipeline/llm-generate.ts` | 修复 PlatformId 类型 |
| `storage/schema.ts` | accounts/assets/publish_jobs 表结构更新 |
| `storage/repository.ts` | 新增 Account CRUD + publish_jobs 新字段 |
| `local-api/app.ts` | 新增 11 个端点 + 更新 schema 校验 |
| `desktop/PlatformPreview.tsx` | 发布模式下拉添加 copy/share/submit |
| `scripts/acceptance-test.mjs` | 6 平台 → 30 测试用例（含 WordPress/copy 模式） |
| `docs/PRD_ACCEPTANCE.md` | 更新验收清单 |

---

### 九、验证

```bash
npm run typecheck       # ✅ 全部通过
npm run build           # ✅ 全部通过
npm run test:acceptance # ✅ 30/30 PASS
```

验收测试覆盖：
- 6 平台生成 + 校验 + 模拟发布
- 未确认草稿发布被阻断
- 公众号 draft_created + WordPress draft_created
- 知乎/小红书 copy 模式
- 辅助发布 manual-only
- 发布任务和日志验证
- WordPress 适配器注册验证
