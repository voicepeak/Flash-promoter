<p align="center">
  <a href="#zh">🇨🇳 中文</a> · <a href="#en">🇬🇧 英文</a>
</p>

---

<h1 align="center" id="zh">测试指南</h1>

本指南说明如何通过自动化验收脚本和手动操作来测试 MVP。

## 自动化验收测试

运行：

```bash
npm run test:acceptance
```

脚本将依次执行：

1. 在端口 `3345` 上启动临时本地 API。
2. 使用临时 SQLite 数据库。
3. 创建测试文章。
4. 生成 5 个平台版本。
5. 校验所有版本。
6. 验证 Mock 适配器的 transform / validate / publish 流程。
7. 验证未确认的 `draft` 发布被阻断。
8. 确认公众号版本。
9. 验证公众号返回 `draft_created`。
10. 验证默认发布模式。
11. 验证知乎和小红书辅助包为 `manual-only`。
12. 验证所有平台均可模拟发布。
13. 验证发布任务和日志已写入。
14. 停止临时 API。

预期输出：

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

## 手动 UI 测试

启动应用：

```bash
npm run dev
```

打开浏览器访问 `http://127.0.0.1:5173`。

操作步骤：

1. 点击「**载入示例内容**」。
2. 点击「**生成平台版本**」。
3. 确认出现 Mock、公众号、B站、知乎、小红书五个平台标签页。
4. 编辑平台版本正文或标题。
5. 点击「**保存版本**」。
6. 点击「**确认版本**」。
7. 点击「**校验**」。
8. 以默认模式发布。
9. 点击「**四平台模拟发布**」。
10. 查看「发布任务」和「发布日志」。

预期 UI 反馈：

- `平台版本已生成`
- `平台版本已保存`
- `平台版本已确认`
- 校验显示「校验通过」
- 任务显示 `simulated`、`draft_created` 或 `assist_opened`
- 校验和发布操作均写入日志

## API 冒烟测试

在 API 运行状态下：

```bash
curl http://127.0.0.1:3333/api/health
```

预期返回：

```json
{
  "ok": true,
  "name": "flash-promoter",
  "adapters": ["mock", "wechat", "bilibili", "zhihu-assist", "xhs-assist"]
}
```

## 构建校验

运行：

```bash
npm run typecheck
npm run build
```

两条命令均须成功完成。

---

<h1 align="center" id="en">Testing Guide</h1>

This guide explains how to test the MVP manually and with the automated acceptance script.

## Automated Acceptance Test

Run:

```bash
npm run test:acceptance
```

The script will:

1. Start a temporary local API on port `3345`.
2. Use a temporary SQLite database.
3. Create a test post.
4. Generate five platform drafts.
5. Validate all drafts.
6. Verify Mock adapter transform / validate / publish flow.
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
npm run dev
```

Open `http://127.0.0.1:5173` in browser.

Steps:

1. Click 「**载入示例内容**」.
2. Click 「**生成平台版本**」.
3. Confirm tabs appear for Mock, WeChat, Bilibili, Zhihu, and Xiaohongshu.
4. Edit platform draft body or title.
5. Click 「**保存版本**」.
6. Click 「**确认版本**」.
7. Click 「**校验**」.
8. Publish with the default mode.
9. Click 「**四平台模拟发布**」.
10. Check 「**发布任务**」 and 「**发布日志**」.

Expected UI signals:

- `平台版本已生成`
- `平台版本已保存`
- `平台版本已确认`
- Validation shows 校验通过
- Jobs show `simulated`, `draft_created`, or `assist_opened`
- Validation and publish operations write logs

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
