# Changelog

All notable changes to Flash Promoter will be documented in this file.

---

## [1.0.0] — 2026-05-31

### Core

- **Multi-platform content publishing workbench** — write once, publish everywhere
- Markdown / rich-text / plain-text input with drag-and-drop image upload
- Unified `CanonicalPost` content model with 7 block types
- Plugin-based platform adapter architecture (`PlatformAdapter` + `Registry`)
- Full publishing pipeline: Input → Generate → Edit/Confirm → Validate → Publish → Results
- Local-first, zero cloud dependency — all data stored in SQLite (WAL mode)
- Persistent logging for posts, drafts, publish jobs, and assets
- Multi-step wizard UI with separate article and video workflows

### Platform Support

- **WeChat Official Account** — real API integration with access_token, material/image upload, and draft/add
- **Bilibili** — article and video title/partition/tags adaptation, pinned comment support
- **Zhihu** — QA-style content adaptation with topic assignment
- **Xiaohongshu (RED)** — note body, hashtags, cover text, and card text adaptation
- **WordPress** — real API draft creation via REST API with credential support
- 28 `PlatformId` values defined for future expansion

### AI / LLM Integration

- Optional OpenAI-compatible LLM for per-platform content generation with distinct style prompts
- Dedicated AI image generation (DALL-E compatible) with configurable model and base URL
- LLM-powered video frame visual analysis via screenshot extraction (8 frames, 640px)
- Separate API key fields for text and image generation providers
- Rule-based structured local adaptation fallback when no LLM is configured
- AI-generated content blocked until human confirmation

### Video Workflow

- Full video content publishing pipeline with transcoding and frame analysis
- Separate multi-step wizard: Info → Platform Select → Generate → Review → Validate → Results
- Graceful handling of empty video content

### Desktop App

- React 19 SPA with Vite 7 (hot reload, proxy to local API)
- Landing page with cyber-editorial design
- Platform credential management UI with per-platform setup guides
- Settings page for LLM configuration, safety toggles, and account management
- Publish history listing with job and log tracking
- Per-platform preview and editing tabs with custom metadata fields
- Image manager with drag-and-drop upload and thumbnail preview
- Actionable error hints in publish results (IP whitelist, credentials, content format guidance)

### Safety & Security

- **No real publishing by default** — all operations are simulated locally
- Real publish safety system with global and per-platform toggles
- Publish mode gating: `simulate`, `copy`, `share`, `assist`, `draft`, `submit`, `publish` (reserved)
- AI-content requires human confirmation before publishing
- `publish` mode requires secondary confirmation
- Safety state persisted to SQLite and restored on server startup
- Credential vault for secure storage of platform API keys

### Infrastructure

- Monorepo architecture with npm workspaces (`apps/*`, `packages/*`)
- TypeScript 5.9 strict mode, ESM, ES2022 target
- Fastify 5.6 API server with Zod 4 validation
- Node.js `node:sqlite` for embedded database (no external DB required)
- Automated acceptance test suite (10+ step E2E verification)
- GitHub Actions CI/CD for landing page deployment to GitHub Pages
- Node.js >= 24 required

### Bug Fixes

- Fix masked-key overwrite in credential fields
- Fix inline images in WeChat drafts
- Fix result redirect after publish
- Fix 413 body limit for large requests
- Fix dynamic import `node:zlib` to prevent server crash from static ESM import
- Fix dynamically generate valid 300x250 PNG cover at runtime
- Fix Vite proxy 60s timeout and skip LLM call when not configured
- Fix remove `tsx watch` from API dev to prevent request drops on file save
- Fix WeChat `errcode` absent means success, proper fallback cover image
- Fix use Buffer for WeChat image upload with size checks and placeholder cover fallback
- Fix WeChat draft auto-uploads cover image to material library before creation
- Fix separate image API key field for different providers
- Fix add SQLite migration for schema changes
- Fix correct publish button label and real publish count in result message
- Fix WeChat credential guide with correct menu paths and AppSecret notes
- Fix Bilibili credential setup guide steps
- Fix guard LLM generation behind strict config check to avoid hanging
- Fix remove unused imports

---

[1.0.0]: https://github.com/voicepeak/flash-promoter/releases/tag/v1.0.0
