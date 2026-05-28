<p align="center">
  <a href="#zh">🇨🇳 中文</a> · <a href="#en">🇬🇧 英文</a>
</p>

---

<h1 align="center" id="zh">用户指南</h1>

本指南说明如何使用 `flash-promoter` 本地 MVP 完成内容跨平台发布。

## 启动

启动 API：

```bash
npm run dev:api
```

启动桌面工作台：

```bash
npm run dev:desktop
```

打开浏览器访问：

```text
http://127.0.0.1:5173
```

## 基本流程

1. 载入或编写内容。
2. 点击「**生成平台版本**」。
3. 切换各平台预览标签页查看效果。
4. 编辑平台标题、摘要、正文、标签或元数据。
5. 点击「**保存版本**」。
6. 点击「**确认版本**」。
7. 点击「**校验**」。
8. 选择发布模式。
9. 点击「**发布**」，或点击「**四平台模拟发布**」。
10. 在右侧面板查看「发布任务」和「发布日志」。

## 输入模式

- **Markdown**：主要输入模式，支持实时预览。
- **富文本**：粘贴或编辑简单 HTML / 富文本内容。
- **纯文本**：纯文本段落输入。

图片可通过图片按钮选择上传，或直接拖入编辑区域。

## 平台版本

生成的平台版本可编辑，每个版本包含：

- 平台标题
- 平台摘要
- 平台正文
- 标签
- 平台专属元数据

修改版本内容会自动清除之前的确认状态，因为内容需重新审核。

## 确认规则

平台版本由 AI 自动生成，初始为**未确认**状态。

在执行 `draft`、`assist` 或 `publish` 之前，必须点击：

```text
确认版本
```

`simulate` 模式无需确认即可执行。

## 发布模式

| 模式 | 含义 | MVP 行为 |
|:---|:---|:---|
| `simulate` | 纯测试发布 | 不调用任何真实平台 |
| `draft` | 创建平台草稿 | 公众号返回模拟 `draft_created` |
| `assist` | 浏览器/人工辅助 | 知乎/小红书生成 manual-only 辅助包 |
| `publish` | 真实发布 | MVP 阶段预留并阻断 |

## 默认模式

| 平台 | 默认模式 |
|:---|:---|
| 微信公众号 | `draft` |
| B站 | `simulate` |
| 知乎 | `assist` |
| 小红书 | `assist` |

## 安全边界

MVP 阶段**不会**执行以下操作：

- 绕过登录
- 绕过验证码
- 绕过平台风控
- 点击最终发布按钮
- 使用隐藏/私有平台 API
- 默认调用真实发布 API

## 如何确认运行成功

查看右侧面板：

- **内容草稿**：SQLite 中保存的本地文章。
- **发布任务**：发布任务及最终状态。
- **发布日志**：校验、阻断、模拟发布、草稿发布和辅助发布日志。

预期成功状态：

- `simulated`
- `draft_created`
- `assist_opened`

---

<h1 align="center" id="en">User Guide</h1>

This guide explains how to use the `flash-promoter` local MVP for cross-platform content publishing.

## Start

Start the API:

```bash
npm run dev:api
```

Start the desktop workbench:

```bash
npm run dev:desktop
```

Open in browser:

```text
http://127.0.0.1:5173
```

## Basic Flow

1. Load or write content.
2. Click 「**生成平台版本**」.
3. Switch between platform preview tabs.
4. Edit platform title, summary, body, tags, or metadata.
5. Click 「**保存版本**」.
6. Click 「**确认版本**」.
7. Click 「**校验**」.
8. Choose a publish mode.
9. Click 「**发布**」, or click 「**四平台模拟发布**」.
10. Check 「**发布任务**」 and 「**发布日志**」 in the right panel.

## Input Modes

- **Markdown**: primary input mode with live preview.
- **Rich Text**: paste or edit simple HTML / rich content.
- **Plain Text**: plain paragraph input.

Images can be added via the image button or by dragging files into the editor area.

## Platform Drafts

Generated platform drafts are editable. Each draft includes:

- Platform title
- Platform summary
- Platform body
- Tags
- Platform-specific metadata

Changing a draft clears the previous confirmation — content needs re-review.

## Confirmation Rule

Platform versions are AI-generated and initially **unconfirmed**.

Before using `draft`, `assist`, or `publish`:

```text
确认版本
```

`simulate` runs without confirmation.

## Publish Modes

| Mode | Meaning | MVP Behavior |
|:---|:---|:---|
| `simulate` | Test-only | Never calls real platforms |
| `draft` | Create platform draft | WeChat returns simulated `draft_created` |
| `assist` | Browser/manual assist | Zhihu/XHS generate manual-only packages |
| `publish` | Real publish | Reserved and blocked in MVP |

## Default Modes

| Platform | Default Mode |
|:---|:---|
| WeChat | `draft` |
| Bilibili | `simulate` |
| Zhihu | `assist` |
| Xiaohongshu | `assist` |

## Safety Boundary

The MVP does **not**:

- Bypass login
- Bypass captcha
- Bypass platform risk control
- Click final publish buttons
- Use hidden/private platform APIs
- Call real publishing APIs by default

## How To Know It Worked

Look at the right panel:

- **内容草稿**: local posts saved in SQLite.
- **发布任务**: publish jobs and final statuses.
- **发布日志**: validation, blocking, simulated publish, draft, and assist logs.

Expected successful statuses:

- `simulated`
- `draft_created`
- `assist_opened`
