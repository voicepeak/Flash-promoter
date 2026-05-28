<p align="center">
  <a href="#zh">🇨🇳 中文</a> · <a href="#en">🇬🇧 英文</a>
</p>

---

<h1 align="center" id="zh">PRD 验收清单</h1>

本文档对照 PRD 追踪当前实现状态。

## P0 必做功能

| PRD 条目 | 状态 | 备注 |
|:---|:---|:---|
| Markdown 输入 | 已完成 | 编辑器支持 Markdown 和预览 |
| 富文本输入 | 已完成 | 基础 HTML / 富文本编辑器 |
| 纯文本输入 | 已完成 | 纯文本模式 |
| 图片上传 | 已完成 | 文件选择和拖拽上传 |
| CanonicalPost | 已完成 | 实现于 `packages/core` |
| Block 模型 | 已完成 | 段落、标题、图片、引用、代码、列表、分割线 |
| 四平台版本 | 已完成 | 公众号、知乎、B站、小红书 |
| Mock 适配器 | 已完成 | 完整 transform / validate / publish |
| 平台预览 | 已完成 | 独立标签页和预览组件 |
| 发布校验 | 已完成 | 通用 + 平台专项 MVP 检查 |
| 模拟发布 | 已完成 | 所有平台均支持 simulate |
| 发布日志 | 已完成 | SQLite 持久化 |
| SQLite 存储 | 已完成 | Posts、Drafts、Jobs、Accounts、Assets、Logs |
| PlatformAdapter 接口 | 已完成 | Registry 支持插件式适配器 |

## MVP 验收

| PRD 验收项 | 状态 | 证据 |
|:---|:---|:---|
| 生成公众号长文版本 | 已完成 | 从 CanonicalPost 生成公众号草稿 |
| 生成知乎逻辑版本 | 已完成 | 知乎草稿包含话题标签和逻辑提示 |
| 生成 B站标题/简介/标签 | 已完成 | 生成 B站元数据 |
| 生成小红书笔记/卡片文案 | 已完成 | 正文、话题标签、封面文字、卡片文案 |
| 用户可编辑生成内容 | 已完成 | 草稿编辑器和保存接口 |
| 用户必须确认生成内容 | 已完成 | 未确认则阻断 draft / assist / publish |
| 四平台模拟发布 | 已完成 | 验收脚本验证所有平台 |
| 任务和日志写入 | 已完成 | 验收脚本校验数量 |
| 公众号草稿模式 | 已完成 | 模拟 `draft_created` |
| 知乎/小红书辅助模式 | 已完成 | `assist_opened`，`manual-only` 包 |
| 插件扩展路径 | 已完成 | Registry 注册适配器，不修改核心流程 |

## 安全边界

| 边界 | 状态 |
|:---|:---|
| 默认不做真实发布 | 已完成 |
| `publish` 需二次确认 | 已完成 |
| MVP 适配器中真实发布已禁用 | 已完成 |
| 辅助发布不点击最终发布按钮 | 已完成 |
| 辅助包标记最终操作为 manual-only | 已完成 |
| 不绕过登录/验证码/风控 | 设计保证 |
| 发布操作写入日志 | 已完成 |

## P1 推荐功能

| PRD 条目 | 状态 | 备注 |
|:---|:---|:---|
| 公众号真实草稿 API | 未实现 | 仅模拟 |
| B站投稿参数 | 已完成 | 模拟参数和校验 |
| 小红书卡片导出 | 部分完成 | 卡片文字预览，未做图片导出 |
| 知乎辅助发布 | 部分完成 | 辅助包和打开链接，未做真实页面填充 |
| Playwright 页面填充 | 未实现 | 保持在 MVP 安全边界外 |
| 本地加密凭据 | 未实现 | 未存储真实凭据 |

## P2 / 未来范围

MVP 中未实现：

- 真实公众号 API 调用（token / 素材 / 草稿）
- 真实 B站上传/投稿 API
- 知乎/小红书浏览器自动化填充
- 小红书图片素材导出
- 团队协作
- 数据分析
- 定时发布
- 插件市场
- Electron / Tauri 打包

## 验证

运行：

```bash
npm run typecheck
npm run build
npm run test:acceptance
```

---

<h1 align="center" id="en">PRD Acceptance</h1>

This document tracks the current implementation against the PRD.

## P0 Required Features

| PRD Item | Status | Notes |
|:---|:---|:---|
| Markdown input | Done | Editor supports Markdown and preview |
| Rich text input | Done | Basic HTML / rich text editor |
| Plain text input | Done | Plain text mode |
| Image upload | Done | File selection and drag-and-drop |
| CanonicalPost | Done | Implemented in `packages/core` |
| Block model | Done | Paragraph, heading, image, quote, code, list, divider |
| Four platform versions | Done | WeChat, Zhihu, Bilibili, Xiaohongshu |
| Mock adapter | Done | Full transform / validate / publish |
| Platform previews | Done | Independent tabs and preview components |
| Publish validation | Done | Common and platform-specific MVP checks |
| Simulated publishing | Done | All platforms support simulate |
| Publish logs | Done | SQLite-backed logs |
| SQLite storage | Done | Posts, Drafts, Jobs, Accounts, Assets, Logs |
| PlatformAdapter interface | Done | Registry supports plugin-style adapters |

## MVP Acceptance

| PRD Acceptance | Status | Evidence |
|:---|:---|:---|
| Generate WeChat long-form | Done | Draft generated from CanonicalPost |
| Generate Zhihu logic version | Done | Draft includes topics and logic hints |
| Generate Bilibili title/description/tags | Done | Metadata generated |
| Generate Xiaohongshu note/card texts | Done | Body, hashtags, cover text, card texts |
| User can edit generated content | Done | Draft editor and save endpoint |
| User must confirm generated content | Done | Draft / assist / publish blocked until confirmed |
| Four-platform simulate publish | Done | Acceptance script verifies all platforms |
| Jobs and logs written | Done | Acceptance script verifies counts |
| WeChat draft mode | Done | Simulated `draft_created` |
| Zhihu / XHS assist mode | Done | `assist_opened`, `manual-only` package |
| Plugin extension path | Done | Registry registers adapters without core changes |

## Safety Boundary

| Boundary | Status |
|:---|:---|
| No real publishing by default | Done |
| `publish` requires second confirmation | Done |
| Real publish disabled in MVP adapters | Done |
| Assist publish does not click final publish | Done |
| Assist package marks final action manual-only | Done |
| No bypass of login / captcha / risk control | Done by design |
| Logs written for publish operations | Done |

## P1 Recommended Features

| PRD Item | Status | Notes |
|:---|:---|:---|
| WeChat real draft API | Not implemented | Simulated only |
| Bilibili submission params | Done | Simulated params and validation |
| Xiaohongshu card export | Partial | Card text preview, no image export |
| Zhihu assist publish | Partial | Assist package and open URL, no real page fill |
| Playwright page fill | Not implemented | Kept out of MVP safety boundary |
| Local encrypted credentials | Not implemented | No real credentials stored |

## P2 / Future Scope

Not implemented in MVP:

- Real WeChat API calls (token / material / draft)
- Real Bilibili upload / submission API
- Browser automation for Zhihu / Xiaohongshu
- Xiaohongshu image asset export
- Team workflow
- Analytics
- Scheduling
- Plugin marketplace
- Electron / Tauri packaging

## Verification

Run:

```bash
npm run typecheck
npm run build
npm run test:acceptance
```
