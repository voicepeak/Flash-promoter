<p align="center">
  <a href="#zh">中文</a> · <a href="#en">英文</a>
</p>

---

<h1 align="center" id="zh">PRD 验收清单</h1>

本文档对照 Issue #17 PRD 追踪当前实现状态。

## P0 必做功能

| PRD 条目 | 状态 | 备注 |
|:---|:---|:---|
| Markdown 输入 | 已完成 | 编辑器支持 Markdown 和预览 |
| 富文本输入 | 已完成 | 基础 HTML / 富文本编辑器 |
| 纯文本输入 | 已完成 | 纯文本模式 |
| 图片上传 | 已完成 | 文件选择和拖拽上传 |
| CanonicalPost | 已完成 | 实现于 `packages/core` |
| Block 模型 | 已完成 | 段落、标题、图片、引用、代码、列表、分割线 |
| 六平台版本 | 已完成 | 公众号、知乎、B站、小红书、WordPress、Mock |
| Mock 适配器 | 已完成 | 完整 transform / validate / publish |
| 平台预览 | 已完成 | 独立标签页和预览组件 |
| 发布校验 | 已完成 | 通用 + 平台专项 MVP 检查 |
| 模拟发布 | 已完成 | 所有平台均支持 simulate |
| 发布日志 | 已完成 | SQLite 持久化 |
| SQLite 存储 | 已完成 | Posts、Drafts、Jobs、Accounts、Assets、Logs |
| PlatformAdapter 接口 | 已完成 | AdapterRegistry 支持插件式适配器 |
| PlatformManifest | 已完成 | 全部 29 个平台 Manifest 定义 |
| PublishLevel 分层 (L0-L4) | 已完成 | simulate/copy/share/assist/draft/container/submit/publish/status/metrics |
| 凭证加密 Vault | 已完成 | AES-256-GCM 加密，`packages/core/src/security/` |
| Dry Run 机制 | 已完成 | performDryRun() 支持所有适配器 |
| REAL_PUBLISH_ENABLED | 已完成 | 全局开关 + 平台级开关 |
| FieldMapping | 已完成 | 8 组平台字段映射已定义 |
| PreparedAssets | 已完成 | 资产处理类型和管线已定义 |
| AuthAdapter / AssetAdapter 接口 | 已完成 | 子适配器接口已定义 |
| PublishJob 增强 | 已完成 | level/externalUrl/reviewStatus/errorCode 等字段 |
| WordPress 适配器 | 已完成 | P0 官方 REST API 草稿/发布 |
| Playwright 浏览器辅助 | 已完成 | 辅助包生成、字段提取、复制文本生成 |
| PublishMode 扩展 | 已完成 | simulate/copy/share/assist/draft/submit/publish |

## 平台覆盖

| 优先级 | 平台 | 状态 |
|:---|:---|:---|
| P0 | 微信公众号 (wechat) | ✅ 适配器完整，模拟 draft |
| P0 | B站 (bilibili) | ✅ 适配器完整，模拟 simulate |
| P0 | 小红书 (xhs-assist) | ✅ 辅助发布 + copy/share |
| P0 | 知乎 (zhihu-assist) | ✅ 辅助发布 + copy |
| P0 | WordPress (wordpress) | ✅ 适配器完整，模拟 draft |
| P1 | 抖音 (douyin) | ✅ Manifest 已定义，待实现真实 API |
| P1 | 快手 (kuaishou) | ✅ Manifest 已定义 |
| P1 | YouTube (youtube) | ✅ Manifest 已定义 |
| P1 | Instagram (instagram) | ✅ Manifest 已定义 |
| P1 | Threads (threads) | ✅ Manifest 已定义 |
| P1 | Facebook Pages | ✅ Manifest 已定义 |
| P1 | X/Twitter (x-twitter) | ✅ Manifest 已定义 |
| P1 | LinkedIn (linkedin) | ✅ Manifest 已定义 |
| P2 | Pinterest/Reddit/Medium/Mastodon/Bluesky/Telegram/Discord/Ghost | ✅ Manifest 已定义 |
| P3 | 头条/百家号/CSDN/掘金/简书/豆瓣/Notion | ✅ Manifest 已定义 |

## 架构验收

| 验收项 | 状态 |
|:---|:---|
| PlatformAdapter 统一接口 | 已完成 |
| AdapterRegistry 插件注册 | 已完成 |
| PlatformManifest 能力声明 | 已完成 |
| 能力分层 (L0-L4) | 已完成 |
| 子适配器 (Auth/Asset/Status/Metrics) | 已完成 |
| FieldMapping 引擎 | 已完成 |
| Dry Run 机制 | 已完成 |
| 发布前二次确认 | 已完成 |
| 凭证加密存储 | 已完成 |
| 平台 Api 不绕过安全边界 | 已完成 |
| 辅助发布 manual-only | 已完成 |
| 新增平台不修改核心流程 | 已完成 |

## P1 推荐功能

| PRD 条目 | 状态 | 备注 |
|:---|:---|:---|
| 公众号真实草稿 API | 未实现 | 仅模拟 |
| B站真实投稿 API | 未实现 | 仅模拟 |
| 小红书卡片导出 | 部分完成 | 文字预览，未做图片导出 |
| 知乎辅助发布 (Playwright) | 部分完成 | 辅助包生成，未用 Playwright 填充 |
| 本地加密凭据 (CredentialVault) | 已完成 | `packages/core/src/security/vault.ts` |
| WordPress 真实 API | 部分完成 | 适配器已实现，接口模拟 |

## P2 / 未来范围

未实现：

- 真实平台 API 调用（token / 素材 / 草稿 / 上传）
- B站视频分片上传
- 浏览器自动化填充（Playwright 真实操作）
- 小红书图片素材导出到本地文件
- 定时发布 / 批量发布
- 团队协作 / 审核流
- 数据分析 / Metrics 实际查询
- 插件市场
- Electron / Tauri 打包

## 验证

运行：
```bash
npm run typecheck
npm run build
npm run test:acceptance
```

当前验收结果：**30/30 PASS**

---

<h1 align="center" id="en">PRD Acceptance</h1>

This document tracks the current implementation against Issue #17 PRD.

## P0 Required Features

| PRD Item | Status |
|:---|:---|
| PlatformAdapter interface | Done |
| 6 platform adapters | Done |
| PlatformManifest (29 platforms) | Done |
| PublishLevel L0-L4 | Done |
| FieldMapping engine | Done |
| CredentialVault (AES-256-GCM) | Done |
| Dry Run mechanism | Done |
| Browser assist foundation | Done |
| WordPress adapter (P0) | Done |
| PublishJob enhanced model | Done |
| Sub-adapters (Auth/Asset/Status/Metrics) | Done |

## Verification

```bash
npm run typecheck  # passes
npm run build      # passes
npm run test:acceptance  # 30/30 PASS
```
