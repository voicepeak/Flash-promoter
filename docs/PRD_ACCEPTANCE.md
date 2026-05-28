# PRD Acceptance

This document tracks the current implementation against the PRD.

## P0 Required Features

| PRD item | Status | Notes |
|---|---|---|
| Markdown input | Done | Editor supports Markdown and preview |
| Rich text input | Done | Basic HTML/rich text editor |
| Plain text input | Done | Plain text mode |
| Image upload | Done | File selection and drag-and-drop |
| CanonicalPost | Done | Implemented in `packages/core` |
| Block model | Done | Paragraph, heading, image, quote, code, list, divider |
| Four platform versions | Done | WeChat, Zhihu, Bilibili, Xiaohongshu |
| Mock adapter | Done | Full transform/validate/publish |
| Platform previews | Done | Independent tabs and preview components |
| Publish validation | Done | Common and platform-specific MVP checks |
| Simulated publishing | Done | All platforms support simulate |
| Publish logs | Done | SQLite-backed logs |
| SQLite storage | Done | Posts, drafts, jobs, accounts, assets, logs |
| PlatformAdapter interface | Done | Registry supports plugin-style adapters |

## MVP Acceptance

| PRD acceptance | Status | Evidence |
|---|---|---|
| Generate WeChat long-form version | Done | WeChat draft generated from CanonicalPost |
| Generate Zhihu logic version | Done | Zhihu draft includes topics and logic hints |
| Generate Bilibili title/description/tags | Done | Bilibili metadata generated |
| Generate Xiaohongshu short note/card texts | Done | XHS body, hashtags, cover text, card texts |
| User can edit generated content | Done | Draft editor and save endpoint |
| User must confirm generated content | Done | `draft/assist/publish` blocked until confirmation |
| Four-platform simulate publish | Done | Acceptance script verifies all platforms |
| Jobs and logs written | Done | Acceptance script verifies counts |
| WeChat draft mode | Done | Simulated `draft_created` |
| Zhihu/XHS assist mode | Done | `assist_opened`, `manual-only` package |
| Plugin extension path | Done | Registry registers adapters without core flow changes |

## Safety Boundary

| Boundary | Status |
|---|---|
| No real publishing by default | Done |
| `publish` requires second confirmation | Done |
| Real publish disabled in MVP adapters | Done |
| Assist publish does not click final publish | Done |
| Assist package marks final action manual-only | Done |
| No bypass of login/captcha/risk control | Done by design |
| Logs written for publish operations | Done |

## P1 Recommended Features

| PRD item | Status | Notes |
|---|---|---|
| WeChat real draft API | Not implemented | Simulated only |
| Bilibili submission params | Done | Simulated params and validation |
| Xiaohongshu card export | Partial | Card text preview, no image export |
| Zhihu copy/assist publish | Partial | Assist package and open URL, no real page fill |
| Playwright page fill | Not implemented | Kept out of MVP safety boundary |
| Local encrypted credentials | Not implemented | No real credentials stored |

## P2 / Future Scope

Not implemented in MVP:

- Real WeChat API token/material/draft calls.
- Real Bilibili upload/submission API.
- Real browser automation filling for Zhihu/Xiaohongshu.
- Xiaohongshu image asset export.
- Team workflow.
- Analytics.
- Scheduling.
- Plugin marketplace.
- Electron/Tauri packaging.

## Verification

Run:

```bash
npm run typecheck
npm run build
npm run test:acceptance
```
