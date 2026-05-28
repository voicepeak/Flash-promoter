# Testing Guide

This document explains how to test the MVP manually and with the automated acceptance script.

## Automated Acceptance Test

Run:

```bash
npm run test:acceptance
```

The script will:

1. Start a temporary local API on port `3345`.
2. Use a temporary SQLite database under `.codex-run/acceptance-data`.
3. Create a test post.
4. Generate five platform drafts.
5. Validate all drafts.
6. Verify `mock` transform/validate/publish.
7. Verify unconfirmed `draft` publishing is blocked.
8. Confirm the WeChat draft.
9. Verify WeChat returns `draft_created`.
10. Verify default publish modes.
11. Verify Zhihu and Xiaohongshu assist packages are `manual-only`.
12. Verify all platforms can `simulate`.
13. Verify publish jobs and logs are written.
14. Stop the temporary API.

Expected output:

```text
PASS create CanonicalPost
PASS generate 5 platform drafts
PASS validate all drafts
PASS mock simulate publish
PASS block unconfirmed draft publish
PASS wechat draft_created after confirmation
PASS default modes
PASS assist packages manual-only
PASS all platforms simulate
PASS publish logs written
```

## Manual UI Test

Start the app:

```bash
npm run dev:api
npm run dev:desktop
```

Open:

```text
http://127.0.0.1:5173
```

Steps:

1. Click `载入示例内容`.
2. Click `生成平台版本`.
3. Confirm that tabs appear for Mock, WeChat, Bilibili, Zhihu, and Xiaohongshu.
4. Edit the platform draft body or title.
5. Click `保存版本`.
6. Click `确认版本`.
7. Click `校验`.
8. Publish with the default mode.
9. Click `四平台模拟发布`.
10. Check `发布任务` and `发布日志`.

Expected UI signals:

- `平台版本已生成`.
- `平台版本已保存`.
- `平台版本已确认`.
- Validation shows `校验通过`.
- Jobs show `simulated`, `draft_created`, or `assist_opened`.
- Logs are added for validation and publishing.

## API Smoke Test

With the API running:

```bash
curl http://127.0.0.1:3333/api/health
```

Expected:

```json
{
  "ok": true,
  "name": "flash-promoter",
  "adapters": ["mock", "wechat", "bilibili", "zhihu-assist", "xhs-assist"]
}
```

## Build Validation

Run:

```bash
npm run typecheck
npm run build
```

Both commands should complete successfully.
