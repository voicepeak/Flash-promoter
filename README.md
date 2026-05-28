# flash-promoter

`flash-promoter` is a local-first MVP for adapting one source post into platform-specific versions for WeChat Official Account, Zhihu, Bilibili, and Xiaohongshu.

The current MVP does not call real publishing APIs. It focuses on the PRD core loop:

```text
content input -> CanonicalPost -> platform drafts -> preview -> validation -> simulated/draft/assist publish -> logs
```

## Requirements

- Node.js 24+
- npm 11+

## Install

```bash
npm install
```

## Run Locally

Start the local API:

```bash
npm run dev:api
```

Start the desktop web workspace in another terminal:

```bash
npm run dev:desktop
```

Open:

```text
http://127.0.0.1:5173
```

The API runs on:

```text
http://127.0.0.1:3333
```

Local data is stored in:

```text
data/flash-promoter.sqlite
```

## What Works Now

- Markdown / rich text / plain text input.
- Image upload and drag-and-drop.
- Conversion into `CanonicalPost`.
- Platform draft generation for:
  - Mock
  - WeChat Official Account
  - Bilibili
  - Zhihu assist
  - Xiaohongshu assist
- Platform preview tabs.
- Platform draft editing, saving, and confirmation.
- Validation before publishing.
- Four publish modes:
  - `simulate`
  - `draft`
  - `assist`
  - `publish`
- Default modes:
  - WeChat: `draft`
  - Bilibili: `simulate`
  - Zhihu: `assist`
  - Xiaohongshu: `assist`
- Simulated publishing for all platforms.
- WeChat draft simulation.
- Zhihu and Xiaohongshu assist packages marked as manual-only.
- SQLite persistence for posts, drafts, jobs, assets, and logs.
- Scripted PRD acceptance test:

```bash
npm run test:acceptance
```

## What Does Not Work Yet

- Real publishing to WeChat, Bilibili, Zhihu, or Xiaohongshu.
- Real platform account setup.
- Real Playwright page filling.
- Xiaohongshu card image export.
- Electron / Tauri packaged desktop app.
- Encrypted credential vault.

These are intentionally outside the current local MVP boundary.

## Useful Commands

```bash
npm run typecheck
npm run build
npm run test:acceptance
```

## Documentation

- [User Guide](docs/USER_GUIDE.md)
- [Testing Guide](docs/TESTING.md)
- [PRD Acceptance](docs/PRD_ACCEPTANCE.md)
