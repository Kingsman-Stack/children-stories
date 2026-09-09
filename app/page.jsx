'use client';

import { useEffect, useState } from 'react';
import styles from './home.module.css';
import { createClient } from '../lib/supabase/client';

const themes = ['Adventure', 'Bedtime', 'Friendship', 'Learning', 'Fantasy', 'Brave'];

export default function Home() {
  const [theme, setTheme] = useState('Adventure');
  const [status, setStatus] = useState('');
  const [story, setStory] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState([]);
  const [voiceName, setVoiceName] = useState('');
  const [library, setLibrary] = useState([]);
  const [recentTitles, setRecentTitles] = useState([]);
  const [parentEmail, setParentEmail] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices().filter(voice => voice.lang.toLowerCase().startsWith('en'));
      setVoices(availableVoices);
      if (!voiceName && availableVoices[0]) setVoiceName(availableVoices[0].name);
    };
    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
  }, [voiceName]);

  useEffect(() => {
    async function loadLibrary() {
      try {
        const openedStory = window.sessionStorage.getItem('storysprout-open-story');
        if (openedStory) { setStory(JSON.parse(openedStory)); window.sessionStorage.removeItem('storysprout-open-story'); }
      } catch { /* Ignore an unavailable session store. */ }
      let localLibrary = [];
      try {
        localLibrary = JSON.parse(window.localStorage.getItem('storysprout-library') || '[]');
        setRecentTitles(JSON.parse(window.localStorage.getItem('storysprout-recent-titles') || '[]'));
      } catch { setRecentTitles([]); }
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLibrary(localLibrary); return; }
      setParentEmail(user.email || 'Parent account');
      const { data } = await supabase.from('stories').select('id,title,language,story_json,created_at').order('created_at', { ascending: false }).limit(30);
      if (data) setLibrary(data.map(item => ({ ...item.story_json, id: item.id, title: item.title, language: item.language, cloud: true })));
    }
    loadLibrary();
  }, []);

  async function saveStory() {
    if (!story) return;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase.from('stories').insert({ user_id: user.id, title: story.title, language: story.language || 'English', status: 'ready', story_json: story }).select('id').single();
      if (error) { setStatus('Could not save to your parent library.'); return; }
      setLibrary(current => [{ ...story, id: data.id, cloud: true }, ...current.filter(item => item.title !== story.title)].slice(0, 30));
      setParentEmail(user.email || 'Parent account');
      setStatus('Saved to your cloud library.');
      return;
    }
    const nextLibrary = [story, ...library.filter(item => item.title !== story.title)].slice(0, 30);
    setLibrary(nextLibrary);
    window.localStorage.setItem('storysprout-library', JSON.stringify(nextLibrary));
    setStatus('Saved to your story library.');
  }

  async function removeStory(title, id) {
    if (id) await createClient().from('stories').delete().eq('id', id);
    const nextLibrary = library.filter(item => item.title !== title);
    setLibrary(nextLibrary);
    window.localStorage.setItem('storysprout-library', JSON.stringify(nextLibrary));
  }

  async function generateStory(event) {
    event.preventDefault();
    setStatus('Preparing a safe story prompt...');
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const response = await fetch('/api/generate-story', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...data, theme, avoidTitles: [...new Set([...recentTitles, ...library.map(item => item.title)])] }),
    });
    const result = await response.json();
    if (result.story) {
      setStory(result.story);
      setRecentTitles(current => {
        const nextTitles = [...new Set([...current, result.story.title])].slice(-200);
        window.localStorage.setItem('storysprout-recent-titles', JSON.stringify(nextTitles));
        return nextTitles;
      });
      setStatus('Your story is ready.');
    } else {
      setStatus(result.error || 'Please check the form and try again.');
    }
  }

  function toggleNarration() {
    if (!story || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setStatus('Text-to-speech is not available in this browser.');
      return;
    }
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const narration = new SpeechSynthesisUtterance(`${story.title}. ${story.paragraphs.join(' ')}`);
    const gentleVoiceNames = ['Samantha', 'Ava', 'Karen', 'Zira', 'Jenny', 'Google UK English Female', 'Microsoft Aria Online'];
    const voices = window.speechSynthesis.getVoices();
    const gentleVoice = voices.find(voice => voice.name === voiceName) || voices.find(voice => gentleVoiceNames.some(name => voice.name.toLowerCase().includes(name.toLowerCase()))) || voices.find(voice => voice.lang.toLowerCase().startsWith('en'));
    if (gentleVoice) {
      narration.voice = gentleVoice;
      narration.lang = gentleVoice.lang;
    } else {
      narration.lang = 'en-US';
    }
    narration.rate = 0.82;
    narration.pitch = 1.12;
    narration.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(narration);
    setIsSpeaking(true);
  }

  return <main className="shell">
    <nav className={styles.nav}><a className="brand" href="/">story<span>sprout</span></a><div className={styles.navLinks}><span className={`${styles.navNote} nav-note`}>A little magic for every bedtime</span><a className={styles.parentLink} href="/auth"><span>For parents</span> <span>↗</span></a></div></nav>
    <section className="hero"><p className="eyebrow">YOUR STORY STUDIO</p><h1>Big adventures.<br /><em>Little listeners.</em></h1><p>Create a safe, one-of-a-kind story made for your child.</p></section>
    <section className="studio">
      <form onSubmit={generateStory} className="card">
        <p className="step">STEP 01</p><h2>Set the scene</h2>
        <label htmlFor="childName">Child&apos;s name</label><input id="childName" name="childName" required maxLength={60} placeholder="e.g. Maya" />
        <div className="two-up"><div><label htmlFor="age">Age</label><select id="age" name="age" defaultValue="early-reader"><option value="toddler">Toddler</option><option value="early-reader">Early reader</option><option value="middle-grade">Middle grade</option></select></div><div><label htmlFor="language">Language</label><select id="language" name="language"><option>English</option><option>Spanish</option><option>French</option><option>Portuguese</option><option>Arabic</option><option>Hindi</option><option>Yoruba</option><option>Hausa</option><option>Igbo</option></select></div></div>
        <label>Theme</label><div className="chips">{themes.map(item => <button type="button" key={item} className={theme === item ? 'chip selected' : 'chip'} onClick={() => setTheme(item)}>{item}</button>)}</div>
        <label htmlFor="lesson">What should they discover?</label><textarea id="lesson" name="lesson" maxLength={500} placeholder="Being brave can start with one tiny step" />
        <button className="primary" type="submit">Generate my story <span>↗</span></button>{status && <p className="status" role="status">{status}</p>}
      </form>
      <aside className="preview"><p className="step">YOUR STORY</p>{story ? <article className="story"><p className="story-theme">{story.theme}</p><h2>{story.title}</h2>{story.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}<div className="story-actions"><button type="button" className="secondary" onClick={toggleNarration}>{isSpeaking ? 'Stop narration' : 'Listen to story'}</button>{voices.length > 0 && <select aria-label="Narration voice" value={voiceName} onChange={event => setVoiceName(event.target.value)}>{voices.map(voice => <option key={`${voice.name}-${voice.lang}`} value={voice.name}>{voice.name}</option>)}</select>}<button type="button" className="secondary" onClick={saveStory}>Save story</button><button type="button" className="secondary" onClick={() => { window.speechSynthesis?.cancel(); setIsSpeaking(false); setStory(null); }}>Make another ↗</button></div></article> : <><div className="moon">☾</div><h2>Your story starts here</h2><p>Fill in a few details and watch a new adventure bloom.</p><div className="stars">· · ✦ · ·</div></>}</aside>
    </section>
      <section className="library" aria-label="Parent story library" style={{ marginTop: 24, background: '#fffefa', border: '1px solid #e4e9e5', borderRadius: 18, padding: 26 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 16, flexWrap: 'wrap' }}><div><p className="step">PARENT LIBRARY</p><h2 style={{ fontFamily: 'Georgia, serif', margin: '8px 0 4px' }}>Saved stories</h2>{parentEmail && <small style={{ color: '#397d74' }}>Cloud library for {parentEmail}</small>}</div><span style={{ color: '#8c9c98', fontSize: 12 }}>{library.length} of 30 saved</span></div>
      {library.length === 0 ? <p style={{ color: '#8c9c98', fontSize: 13, marginBottom: 0 }}>Save a story after generating it and it will appear here {parentEmail ? 'across your devices' : 'on this device'}.</p> : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 10, marginTop: 18 }}>{library.map(item => <div key={item.id || item.title} style={{ border: '1px solid #e4e9e5', borderRadius: 10, padding: 14, background: '#f1f7f3' }}><p className="story-theme" style={{ margin: '0 0 8px' }}>{item.theme}</p><strong style={{ display: 'block', color: '#397d74', marginBottom: 12 }}>{item.title}</strong><button type="button" className="secondary" onClick={() => setStory(item)}>Read</button><button type="button" className="secondary" onClick={() => removeStory(item.title, item.id)} style={{ marginLeft: 12 }}>Delete</button></div>)}</div>}
    </section>
  </main>;
}
