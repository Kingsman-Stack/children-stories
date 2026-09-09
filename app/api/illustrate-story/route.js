import { NextResponse } from 'next/server';
import { z } from 'zod';

const illustrationSchema = z.object({ title: z.string().trim().min(1).max(200), theme: z.string().trim().min(1).max(60), paragraphs: z.array(z.string().trim().min(1).max(5000)).min(1).max(6) });

export async function POST(request) {
  try {
    if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: 'AI illustrations are not configured yet.' }, { status: 503 });
    const input = illustrationSchema.parse(await request.json());
    const prompt = `Create one warm, colorful children's storybook illustration for the story titled "${input.title}". Theme: ${input.theme}. Story summary: ${input.paragraphs.join(' ')}. Use a gentle illustrated style, expressive friendly characters, soft light, no text, no logos, no realistic identifiable children, no violence, and no frightening imagery.`;
    const response = await fetch('https://api.openai.com/v1/images/generations', { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${process.env.OPENAI_API_KEY}` }, body: JSON.stringify({ model: process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1', prompt, size: '1024x1024', quality: 'low', output_format: 'webp' }) });
    if (!response.ok) return NextResponse.json({ error: 'The illustration service could not create an image.' }, { status: 502 });
    const data = await response.json();
    const image = data.data?.[0];
    if (!image?.b64_json) return NextResponse.json({ error: 'The illustration response was empty.' }, { status: 502 });
    return NextResponse.json({ imageUrl: `data:image/webp;base64,${image.b64_json}` });
  } catch { return NextResponse.json({ error: 'Invalid illustration request.' }, { status: 400 }); }
}
