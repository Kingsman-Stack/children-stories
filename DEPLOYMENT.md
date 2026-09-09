# Vercel + Supabase Deployment

## GitHub

Create a private GitHub repository and upload the contents of this folder. Do not upload `.env.local`, API keys, `node_modules`, or `.next`.

## Vercel

1. Import the GitHub repository in Vercel.
2. Keep the framework preset as Next.js.
3. Set the root directory to the repository root.
4. Add the environment variables below in Vercel Project Settings > Environment Variables.
5. Deploy and use the generated Vercel URL for testing.

## Environment variables

Add these in Vercel, not in the source code:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
OPENAI_API_KEY
OPENAI_MODEL=gpt-4o-mini
OPENAI_TTS_VOICE=nova
```

Keep these server-only for later features:

```text
SUPABASE_SERVICE_ROLE_KEY
ELEVENLABS_API_KEY
VIDEO_PROVIDER_API_KEY
VIDEO_PROVIDER_BASE_URL
```

## Supabase

1. Create a Supabase project.
2. Open SQL Editor.
3. Run `supabase/schema.sql`.
4. Copy the project URL and anon key into Vercel.

The current library is local browser storage. Supabase persistence and parent authentication must be connected before storing real child-related data.

## Before launch

- Confirm the homepage and story form work on the Vercel URL.
- Add the OpenAI key to enable fresh AI stories and full language generation.
- Test AI failure fallback, rate limits, moderation, and authentication before collecting real user data.
- Add a custom domain after the preview deployment passes.
