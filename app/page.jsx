'use client';

import { useEffect, useState } from 'react';
import styles from './home.module.css';
import { createClient } from '../lib/supabase/client';

const themes = ['Adventure', 'Bedtime', 'Friendship', 'Learning', 'Fantasy', 'Brave'];

export default function Home() {
  const [theme, setTheme] = useState('Adventure');
  const [status, setStatus] = useState('');
  const [story, setStory] = useState(null);
  const [parentEmail, setParentEmail] = useState('');
  const [library, setLibrary] = useState([]);
  const [recentTitles, setRecentTitles] = useState([]);
  const [darkTheme, setDarkTheme] = useState(false);
  const [audioUrl, setAudioUrl] = useState('');
  const [audioPath, setAudioPath] = useState('');
  const [illustrationUrl, setIllustrationUrl] = useState('');
  const [activeParagraph, setActiveParagraph] = useState(-1);
  const [isNarrating, setIsNarrating] = useState(false);
  const [isIllustrating, setIsIllustrating] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const opened = window.sessionStorage.getItem('storysprout-open-story');
        if (opened) { const openedStory = JSON.parse(opened); setStory(openedStory); setAudioUrl(openedStory.audioUrl || ''); setAudioPath(openedStory.audioPath || ''); setIllustrationUrl(openedStory.illustrationUrl || ''); window.sessionStorage.removeItem('storysprout-open-story'); }
      } catch { /* Ignore unavailable session storage. */ }
      let localLibrary = [];
      try { localLibrary = JSON.parse(window.localStorage.getItem('storysprout-library') || '[]'); setRecentTitles(JSON.parse(window.localStorage.getItem('storysprout-recent-titles') || '[]')); } catch { setRecentTitles([]); }
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLibrary(localLibrary); return; }
      setParentEmail(user.email || 'Parent account');
      const { data } = await supabase.from('stories').select('id,title,language,story_json,created_at').order('created_at', { ascending: false }).limit(30);
      if (!data) return;
      setLibrary(await Promise.all(data.map(async item => {
        const saved = { ...item.story_json, id: item.id, title: item.title, language: item.language, cloud: true };
        if (saved.illustrationPath) { const { data: signed } = await supabase.storage.from('story-media').createSignedUrl(saved.illustrationPath, 3600); saved.illustrationUrl = signed?.signedUrl || ''; }
        if (saved.audioPath) { const { data: signed } = await supabase.storage.from('story-media').createSignedUrl(saved.audioPath, 3600); saved.audioUrl = signed?.signedUrl || ''; }
        return saved;
      })));
    }
    load();
  }, []);

  useEffect(() => { const saved = window.localStorage.getItem('storysprout-theme') === 'dark'; setDarkTheme(saved); document.body.classList.toggle('dark-theme', saved); }, []);
  function toggleTheme() { const next = !darkTheme; setDarkTheme(next); document.body.classList.toggle('dark-theme', next); window.localStorage.setItem('storysprout-theme', next ? 'dark' : 'light'); }

  async function generateStory(event) {
    event.preventDefault(); setStatus('Preparing a safe story prompt...');
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const response = await fetch('/api/generate-story', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...data, theme, avoidTitles: [...new Set([...recentTitles, ...library.map(item => item.title)])] }) });
    const result = await response.json();
    if (!result.story) { setStatus(result.error || 'Please check the form and try again.'); return; }
    setStory(result.story); setAudioUrl(''); setAudioPath(''); setIllustrationUrl(''); setActiveParagraph(-1); setStatus('Your story is ready.');
    setRecentTitles(current => { const next = [...new Set([...current, result.story.title])].slice(-200); window.localStorage.setItem('storysprout-recent-titles', JSON.stringify(next)); return next; });
  }

  async function generateAiNarration() {
    if (!parentEmail) { window.location.href = '/auth'; return; }
    setIsNarrating(true); setStatus('Creating a gentle AI narration...');
    const response = await fetch('/api/narrate-story', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(story) });
    if (!response.ok) { setStatus((await response.json()).error || 'Narration could not be created.'); setIsNarrating(false); return; }
    const blob = await response.blob(); if (audioUrl) URL.revokeObjectURL(audioUrl); setAudioUrl(URL.createObjectURL(blob));
    const supabase = createClient(); const { data: { user } } = await supabase.auth.getUser();
    if (user) { const path = `${user.id}/${crypto.randomUUID()}.mp3`; const { error } = await supabase.storage.from('story-media').upload(path, blob, { contentType: 'audio/mpeg', upsert: false }); if (!error) { setAudioPath(path); if (story.id) await supabase.from('stories').update({ story_json: { ...story, audioPath: path } }).eq('id', story.id); } }
    setStatus('AI narration is ready.'); setIsNarrating(false);
  }

  function syncNarration(event) {
    if (!story || !event.currentTarget.duration) return;
    const target = (event.currentTarget.currentTime / event.currentTarget.duration) * story.paragraphs.join('').length;
    let count = 0; const index = story.paragraphs.findIndex(paragraph => { count += paragraph.length; return count >= target; });
    setActiveParagraph(index < 0 ? story.paragraphs.length - 1 : index);
  }

  async function generateIllustration() {
    if (!parentEmail) { window.location.href = '/auth'; return; }
    setIsIllustrating(true); setStatus('Painting a storybook scene...');
    const response = await fetch('/api/illustrate-story', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(story) });
    const result = await response.json(); if (!response.ok) { setStatus(result.error || 'Illustration could not be created.'); setIsIllustrating(false); return; }
    setIllustrationUrl(result.imageUrl); setStatus('Your storybook illustration is ready.'); setIsIllustrating(false);
  }

  async function saveStory() {
    if (!parentEmail) { window.location.href = '/auth'; return; }
    const supabase = createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return;
    const toSave = { ...story }; if (illustrationUrl?.startsWith('data:image/')) { const path = `${user.id}/${crypto.randomUUID()}.webp`; const { error } = await supabase.storage.from('story-media').upload(path, await fetch(illustrationUrl).then(response => response.blob()), { contentType: 'image/webp' }); if (error) { setStatus('Could not save the illustration.'); return; } toSave.illustrationPath = path; }
    if (audioPath) toSave.audioPath = audioPath; delete toSave.illustrationUrl; delete toSave.audioUrl;
    const { data, error } = await supabase.from('stories').insert({ user_id: user.id, title: story.title, language: story.language || 'English', status: 'ready', story_json: toSave }).select('id').single();
    if (error) { setStatus('Could not save to your parent library.'); return; }
    setLibrary(current => [{ ...story, ...toSave, id: data.id, cloud: true }, ...current.filter(item => item.title !== story.title)].slice(0, 30)); setStatus('Saved to your cloud library.');
  }

  async function removeStory(title, id) { if (id) { const supabase = createClient(); const item = library.find(storyItem => storyItem.id === id); if (item?.illustrationPath) await supabase.storage.from('story-media').remove([item.illustrationPath]); if (item?.audioPath) await supabase.storage.from('story-media').remove([item.audioPath]); await supabase.from('stories').delete().eq('id', id); } setLibrary(current => current.filter(item => item.title !== title)); }
  function printStory() { if (!parentEmail) { window.location.href = '/auth'; return; } window.print(); }

  return <main className="shell"><nav className={styles.nav}><a className="brand" href="/">story<span>sprout</span></a><div className={styles.navLinks}><span className={`${styles.navNote} nav-note`}>A little magic for every bedtime</span><button className={styles.themeButton} type="button" onClick={toggleTheme}>{darkTheme ? 'Light theme' : 'Dark theme'}</button><a className={styles.parentLink} href="/dashboard"><span>Parent dashboard</span> <span>↗</span></a></div></nav><section className="hero"><p className="eyebrow">YOUR STORY STUDIO</p><h1>Big adventures.<br /><em>Little listeners.</em></h1><p>Create a safe, one-of-a-kind story made for your child.</p></section><section className="studio"><form onSubmit={generateStory} className="card"><p className="step">STEP 01</p><h2>Set the scene</h2><label htmlFor="childName">Child&apos;s name</label><input id="childName" name="childName" required maxLength={60} placeholder="e.g. Maya" /><div className="two-up"><div><label htmlFor="age">Age</label><select id="age" name="age" defaultValue="early-reader"><option value="toddler">Toddler</option><option value="early-reader">Early reader</option><option value="middle-grade">Middle grade</option></select></div><div><label htmlFor="language">Language</label><select id="language" name="language"><option>English</option><option>Spanish</option><option>French</option><option>Portuguese</option><option>Dutch</option><option>German</option><option>Italian</option><option>Mandarin</option><option>Japanese</option><option>Korean</option><option>Arabic</option><option>Hindi</option></select></div></div><label>Theme</label><div className="chips">{themes.map(item => <button type="button" key={item} className={theme === item ? 'chip selected' : 'chip'} onClick={() => setTheme(item)}>{item}</button>)}</div><label htmlFor="lesson">What should they discover?</label><textarea id="lesson" name="lesson" maxLength={500} placeholder="Being brave can start with one tiny step" /><button className="primary" type="submit">Generate my story <span>↗</span></button>{status && <p className="status" role="status">{status}</p>}</form><aside className="preview"><p className="step">YOUR STORY</p>{story ? <article className="story" id="story-print"><p className="story-theme">{story.theme}</p><h2>{story.title}</h2>{story.paragraphs.map((paragraph, index) => <p className={activeParagraph === index ? styles.highlighted : ''} key={index}>{paragraph}</p>)}{illustrationUrl && <img className={styles.illustration} src={illustrationUrl} alt={`Storybook illustration for ${story.title}`} />}<div className={styles.storyActions}><button type="button" className={`${styles.actionButton} ${styles.actionPrimary}`} onClick={generateAiNarration} disabled={isNarrating}>{isNarrating ? 'Creating narration...' : 'Listen to story'}</button><button type="button" className={styles.actionButton} onClick={generateIllustration} disabled={isIllustrating}>{isIllustrating ? 'Painting scene...' : 'Create illustration'}</button>{audioUrl && <audio className={styles.audio} controls src={audioUrl} onTimeUpdate={syncNarration} onEnded={() => setActiveParagraph(-1)} aria-label="AI story narration" />}<button type="button" className={styles.actionButton} onClick={saveStory}>Save to library</button><button type="button" className={styles.actionButton} onClick={printStory}>Print / Save PDF</button><button type="button" className={styles.actionButton} onClick={() => setStory(null)}>Make another story</button>{!parentEmail && <small style={{ width: '100%', color: '#8c9c98' }}>Sign in as a parent to listen, save, illustrate, or print.</small>}</div></article> : <><div className="moon">☾</div><h2>Your story starts here</h2><p>Fill in a few details and watch a new adventure bloom.</p><div className="stars">· · ✦ · ·</div></>}</aside></section><section className="library" aria-label="Parent story library" style={{ marginTop: 24, background: '#fffefa', border: '1px solid #e4e9e5', borderRadius: 18, padding: 26 }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 16, flexWrap: 'wrap' }}><div><p className="step">PARENT LIBRARY</p><h2 style={{ fontFamily: 'Georgia, serif', margin: '8px 0 4px' }}>Saved stories</h2>{parentEmail && <small style={{ color: '#397d74' }}>Cloud library for {parentEmail}</small>}</div><span style={{ color: '#8c9c98', fontSize: 12 }}>{library.length} of 30 saved</span></div>{library.length === 0 ? <p style={{ color: '#8c9c98', fontSize: 13, marginBottom: 0 }}>Save a story after generating it and it will appear here {parentEmail ? 'across your devices' : 'on this device'}.</p> : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 10, marginTop: 18 }}>{library.map(item => <div key={item.id || item.title} style={{ border: '1px solid #e4e9e5', borderRadius: 10, padding: 14, background: '#f1f7f3' }}>{item.illustrationUrl && <img src={item.illustrationUrl} alt="" style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 7, marginBottom: 10 }} />}<p className="story-theme" style={{ margin: '0 0 8px' }}>{item.theme}</p><strong style={{ display: 'block', color: '#397d74', marginBottom: 12 }}>{item.title}</strong><button type="button" className="secondary" onClick={() => { setStory(item); setIllustrationUrl(item.illustrationUrl || ''); setAudioUrl(item.audioUrl || ''); setAudioPath(item.audioPath || ''); }}>Read</button><button type="button" className="secondary" onClick={() => removeStory(item.title, item.id)} style={{ marginLeft: 12 }}>Delete</button></div>)}</div>}</section></main>;
}
