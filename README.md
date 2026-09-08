# Children Stories: Full Feature Draft & Build Roadmap

This folder is the production-oriented draft for a safe, parent-owned children's story platform.

## Scope

The app will let a parent create age-appropriate stories using a child's name, age band, theme, moral lesson, setting, traits, language, and optional personalization. The product will eventually support narration, PDF export, illustrations, branching stories, recurring characters, read-along highlighting, parent dashboards, and story history.

## Critical Rules

- Parent or guardian owns the account. Children do not receive independent logins.
- Child data is minimized, protected, deletable, and collected only with appropriate parental consent.
- Every story request passes input moderation before generation and output moderation before storage or display.
- AI keys and provider credentials exist only on the server.
- Every database operation is scoped to the authenticated parent and protected by Supabase RLS.
- All model output is treated as untrusted content and rendered safely.

## AI Video Generation

Yes, story videos can be added, but they should be an asynchronous post-generation workflow:

1. Generate and moderate the structured story first.
2. Create or select page illustrations with a stable character reference.
3. Generate narration audio per page or scene with TTS.
4. Submit a video job to a provider such as a hosted image-to-video or text-to-video API. Keep the provider behind a server-side adapter so it can be changed later.
5. Store only the job ID and status initially: `queued`, `processing`, `ready`, `failed`, or `blocked`.
6. Receive a signed webhook or poll from a server worker; verify webhook signatures before updating the job.
7. Compose scenes, images, narration, captions, and gentle transitions into a final MP4 using a server worker or managed media service.
8. Run safety checks on generated frames, audio, captions, and the final video before making it available.
9. Store the final asset in a private bucket with an expiring signed URL. Never expose provider credentials or permanent public child-media URLs.

### Video Product Options

- **MVP video:** narrated slideshow using approved still illustrations, captions, and light motion. This is cheaper, safer, and more consistent.
- **Later video:** short animated scene clips generated from approved illustrations. Use strict duration, cost, and content limits.
- **Parent controls:** video toggle, voice choice, language, captions, download permission, and delete button.

### Video Safety and Privacy

- Do not use a child's uploaded photo as a video reference until explicit parental consent, retention limits, and provider data-use terms are confirmed.
- Reject unsafe prompts before image or video generation.
- Moderate every illustration, audio transcript, caption, frame, and final video.
- Avoid realistic depictions of identifiable children by default; prefer illustrated characters.
- Apply quotas and rate limits because video generation is expensive.

## Build Phases

### Phase 1: Foundation

- Next.js App Router frontend and server routes
- Supabase Auth, Postgres, and RLS
- Zod server validation
- Provider adapters for Claude/OpenAI, TTS, image, and video
- Structured story JSON schema

### Phase 2: Safe Story Generation

- Parent-owned profiles and consent flow
- Input/output moderation
- Prompt-injection-resistant prompt templates
- Rate limits and generation job queue
- Paginated reader with safe escaping

### Phase 3: Reader and Export

- Narration controls and read-along highlighting
- PDF and ebook export
- Language-aware text direction including RTL
- Story history and deletion flow

### Phase 4: Media

- Consistent illustration pipeline
- Narrated slideshow video
- Asynchronous video jobs and signed downloads
- Optional animated scenes after cost and safety testing

### Phase 5: Growth and Hardening

- Recurring character continuity
- Choose-your-path stories
- Parent dashboard
- Public SEO pages kept separate from private stories
- Accessibility, performance, observability, penetration testing, and deployment rollback plan

## Local Setup

1. Install Node.js 20 or newer.
2. Copy `.env.example` to `.env.local` and fill in server credentials.
3. Install dependencies with `npm install`.
4. Run `npm run dev`.
5. Apply `supabase/schema.sql` to a Supabase project before enabling persistence.

The initial generation route intentionally stops before a paid AI call. The next implementation step is to add authentication, moderation, a provider adapter, and a structured story schema together rather than exposing a raw model endpoint.
