# Complete Feature Specification

## Core MVP Features

| Feature | Description |
| --- | --- |
| Story Generation Engine | Parent enters child's name, age, theme, moral lesson, and setting. A server-side AI call returns a structured story. |
| Age-Appropriate Tone Control | Toddler, early reader, and middle-grade bands control vocabulary, sentence length, and story length. |
| Character Customization | Protagonist name, traits such as brave, curious, and kind, with optional parent-controlled photo personalization. |
| Theme and Genre Selector | Adventure, fantasy, bedtime, educational, friendship, and overcoming fears. |
| Text-to-Speech Narration | Generate narration for pre-readers with page or chapter controls. |
| PDF and Ebook Export | Export a finished story as a printable PDF or simple ebook format. |
| Multi-Language Generation | Generate in English, Spanish, French, Portuguese, Mandarin, Arabic, Hindi, German, Yoruba, Hausa, Igbo, and other supported languages. |

## Post-MVP Features

- AI illustrations per page or paragraph with consistent character design.
- Choose-your-path branching stories.
- Story series and recurring character continuity.
- Read-along highlighting synchronized with narration.
- Parent dashboard with read history, streaks, and vocabulary.
- Story library and history per child profile.
- Light and dark theme switch saved per device.

## Non-Negotiables

- Two-pass content safety: moderate input before generation and text, illustrations, and audio output before delivery.
- NDPR/COPPA-aligned data handling: parental consent, data minimization, retention limits, export, and deletion flows.
- No direct child accounts. A parent or guardian owns the account and manages child profiles.
- No exposed provider keys, service-role keys, or private media URLs in the browser.
- Ownership checks and Supabase RLS on every user-owned resource.

## Roadmap

### Phase 1: Foundation and Backend Core

- Node.js/Next.js server routes with environment-based secrets.
- Supabase schema for users, child profiles, stories, pages, languages, media assets, and generation jobs.
- RLS policies scoped to `auth.uid() = user_id`.
- Server-only `/api/generate-story` endpoint.
- Structured JSON output: title, chapters/pages, reading time, age range, safety flags, and language.

### Phase 2: Safety and Validation

- Server-side length limits and character allowlists.
- Treat all user content as untrusted data inside a structured prompt template.
- Input and output moderation.
- Per-user and per-IP rate limiting.
- Queue long-running story, TTS, and image work.

### Phase 3: Frontend Core

- Story request form with child profile, age, theme, lesson, language, traits, and reading level.
- Chapter/page reader for structured story JSON.
- Safe escaping for all AI and user content.
- TTS controls and progress state.
- PDF export.

### Phase 4: Internationalization

- Independent UI-language and story-language selectors.
- `react-i18next` or equivalent for interface strings.
- Culturally appropriate generation prompts, not literal translation only.
- RTL layout for Arabic and other right-to-left languages.
- RTL-aware PDF and ebook output.

### Phase 5: Public and SEO Pages

- Next.js SSR or prerendering for public pages only.
- Open Graph, canonical URLs, semantic headings, and structured metadata.
- Strict separation between public content and private stories.

### Phase 6: IDOR and Access Control Hardening

- Audit every read, update, and delete route.
- Check ownership in database queries, not only in application code.
- Attempt cross-user story access with modified IDs and confirm safe 404/403 behavior.
- Run Supabase security advisor and resolve all warnings.

### Phase 7: Pre-Launch QA

- Test empty, oversized, malformed, hostile, and prompt-injection inputs.
- Test rate limits, moderation failures, provider failures, retries, and queues.
- Keyboard, screen reader, focus, contrast, and mobile tests.
- Confirm no secrets in source, bundles, logs, or git history.
- Add monitoring, logging, backups, and rollback procedures.

## Recommended Stack

- Frontend: React with Next.js App Router and TypeScript.
- UI i18n: `react-i18next` or a Next.js-compatible equivalent.
- Story generation: Claude API through a server-only provider adapter.
- Illustrations: Stable Diffusion or DALL-E through a server adapter and private CDN storage.
- TTS: ElevenLabs or Amazon Polly, subject to language and child-safety review.
- Backend: Next.js server routes or Node.js service for long-running workers.
- Database: Supabase Postgres with RLS.
- Auth: Supabase Auth or Clerk with a parental-consent flow.
- PDF: `pdf-lib` or server-side Puppeteer.
- Storage: private object storage with expiring signed URLs.
