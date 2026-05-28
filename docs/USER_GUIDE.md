# User Guide

This guide explains how to use the current `flash-promoter` local MVP.

## Start

Run the API:

```bash
npm run dev:api
```

Run the workspace:

```bash
npm run dev:desktop
```

Open:

```text
http://127.0.0.1:5173
```

## Basic Flow

1. Load or write content.
2. Click `生成平台版本`.
3. Review platform tabs.
4. Edit platform title, summary, body, tags, or platform metadata.
5. Click `保存版本`.
6. Click `确认版本`.
7. Click `校验`.
8. Choose a publish mode.
9. Click `发布`, or click `四平台模拟发布`.
10. Check `发布任务` and `发布日志`.

## Input Modes

- `Markdown`: primary MVP input mode.
- `富文本`: paste or edit simple HTML/rich content.
- `纯文本`: plain text paragraphs.

Images can be selected with the image button or dragged into the editor area.

## Platform Drafts

Generated platform drafts are editable. A draft includes:

- Platform title.
- Platform summary.
- Platform body.
- Tags.
- Platform-specific metadata.

Changing a draft clears the previous confirmation because the content needs review again.

## Confirmation Rule

Platform versions are generated automatically and marked as unconfirmed.

Before using `draft`, `assist`, or `publish`, you must click:

```text
确认版本
```

`simulate` can run without confirmation.

## Publish Modes

| Mode | Meaning | MVP behavior |
|---|---|---|
| `simulate` | Test-only publishing | Never calls real platforms |
| `draft` | Create platform draft | WeChat returns simulated `draft_created` |
| `assist` | Browser/manual assist | Zhihu/XHS generate manual-only assist packages |
| `publish` | Real publish | Reserved and blocked in MVP |

## Default Modes

| Platform | Default |
|---|---|
| WeChat | `draft` |
| Bilibili | `simulate` |
| Zhihu | `assist` |
| Xiaohongshu | `assist` |

## Safety Boundary

The MVP does not:

- Bypass login.
- Bypass captcha.
- Bypass platform risk control.
- Click final publish buttons.
- Use hidden/private platform APIs.
- Call real publishing APIs by default.

## How To Know It Worked

Look at the right panel:

- `内容草稿`: local posts saved in SQLite.
- `发布任务`: publish jobs and final statuses.
- `发布日志`: validation, blocking, simulated publish, draft, and assist logs.

Expected successful statuses:

- `simulated`
- `draft_created`
- `assist_opened`
