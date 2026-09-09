import { NextResponse } from 'next/server';
import { z } from 'zod';

const narrationSchema = z.object({
  title: z.string().trim().min(1).max(200),
  paragraphs: z.array(z.string().trim().min(1).max(5000)).min(1).max(10),
  language: z.string().trim().min(2).max(40).default('English'),
});

export async function POST(request) {
  try {
    if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: 'AI narration is not configured yet.' }, { status: 503 });
    const input = narrationSchema.parse(await request.json());
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({ model: 'tts-1', voice: process.env.OPENAI_TTS_VOICE || 'nova', input: `${input.title}. ${input.paragraphs.join(' ')}`, response_format: 'mp3', speed: 0.9 }),
    });
    if (!response.ok) return NextResponse.json({ error: 'The narration service could not create audio.' }, { status: 502 });
    return new Response(await response.arrayBuffer(), { headers: { 'content-type': 'audio/mpeg', 'cache-control': 'private, max-age=3600' } });
  } catch { return NextResponse.json({ error: 'Invalid narration request.' }, { status: 400 }); }
}
