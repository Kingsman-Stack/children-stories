# Children Stories

StorySprout is a parent-owned story platform for creating safe, personalized stories for children.

## Current Features

- OpenAI story generation with age, theme, lesson, and language controls
- Input and output moderation
- Rate limiting on story generation
- Parent authentication with Supabase
- Child profiles and cloud story library
- Parent consent and child-data deletion controls
- OpenAI AI narration
- AI storybook illustrations
- Private illustration storage with signed URLs
- Print and Save as PDF for signed-in parents
- International language selection
- Light and dark theme switch

## Product Direction

The project focuses on stories, narration, illustrations, saving, printing, and parent privacy.

## Local Setup

1. Install Node.js 20 or newer.
2. Copy `.env.example` to `.env.local` and add the Supabase and OpenAI values.
3. Install dependencies with `npm install`.
4. Run `npm run dev`.
5. Apply the Supabase migrations in `supabase/migrations/` before using cloud media.

## Safety Requirements

- Parent or guardian owns the account. Children do not receive independent logins.
- Child data is minimized, protected, deletable, and collected only with appropriate parental consent.
- AI keys and provider credentials exist only on the server.
- Every database operation is scoped to the authenticated parent and protected by Supabase RLS.
- All model output is treated as untrusted content and rendered safely.
