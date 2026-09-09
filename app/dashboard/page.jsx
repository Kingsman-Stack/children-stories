'use client';

import { useEffect, useState } from 'react';
import { createClient } from '../../lib/supabase/client';
import styles from './dashboard.module.css';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [children, setChildren] = useState([]);
  const [stories, setStories] = useState([]);
  const [name, setName] = useState('');
  const [ageBand, setAgeBand] = useState('early-reader');
  const [message, setMessage] = useState('Loading your family shelf...');

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user: signedInUser } } = await supabase.auth.getUser();
      if (!signedInUser) { window.location.href = '/auth'; return; }
      setUser(signedInUser);
      const [{ data: profiles }, { data: savedStories }] = await Promise.all([
        supabase.from('child_profiles').select('id,display_name,age_band,created_at').order('created_at', { ascending: true }),
        supabase.from('stories').select('id,title,language,story_json,created_at').order('created_at', { ascending: false }).limit(30),
      ]);
      setChildren(profiles || []);
      setStories((savedStories || []).map(item => ({ ...item, ...(item.story_json || {}) })));
      setMessage('');
    }
    load();
  }, []);

  async function addChild(event) {
    event.preventDefault();
    if (!name.trim() || !user) return;
    const supabase = createClient();
    const { data, error } = await supabase.from('child_profiles').insert({ user_id: user.id, display_name: name.trim(), age_band: ageBand }).select('id,display_name,age_band,created_at').single();
    if (error) { setMessage(error.message); return; }
    setChildren(current => [...current, data]);
    setName('');
    setMessage('Child profile added.');
  }

  async function deleteChild(id) {
    const supabase = createClient();
    await supabase.from('child_profiles').delete().eq('id', id);
    setChildren(current => current.filter(child => child.id !== id));
  }

  async function deleteStory(id) {
    const supabase = createClient();
    await supabase.from('stories').delete().eq('id', id);
    setStories(current => current.filter(story => story.id !== id));
  }

  async function signOut() {
    await createClient().auth.signOut();
    window.location.href = '/';
  }

  return <main className={styles.page}><nav className={styles.nav}><a className={styles.brand} href="/">story<span>sprout</span></a><button className={styles.signout} type="button" onClick={signOut}>Sign out</button></nav><section className={styles.main}><p className={styles.eyebrow}>PARENT DASHBOARD</p><div className={styles.heading}><div><h1>Your family shelf</h1><p>{user?.email}</p></div><a className={styles.newStory} href="/">Create a new story ↗</a></div>{message && <p className={styles.message} role="status">{message}</p>}<div className={styles.grid}><section className={styles.card}><p className={styles.eyebrow}>YOUR FAMILY</p><h2>Child profiles</h2><form onSubmit={addChild}><label className={styles.label} htmlFor="child-name">Name</label><input className={styles.input} id="child-name" value={name} onChange={event => setName(event.target.value)} maxLength={60} placeholder="e.g. Chloe" required /><label className={styles.label} htmlFor="child-age">Reading level</label><select className={styles.select} id="child-age" value={ageBand} onChange={event => setAgeBand(event.target.value)}><option value="toddler">Toddler</option><option value="early-reader">Early reader</option><option value="middle-grade">Middle grade</option></select><button className={styles.add} type="submit">Add child profile +</button></form>{children.map(child => <div className={styles.child} key={child.id}><button className={styles.delete} type="button" onClick={() => deleteChild(child.id)}>Delete</button><strong>{child.display_name}</strong><small>{child.age_band.replace('-', ' ')}</small></div>)}</section><section className={styles.card}><p className={styles.eyebrow}>STORY LIBRARY</p><h2>Saved adventures</h2>{stories.length === 0 ? <p className={styles.empty}>Stories you save from the studio will appear here and follow you across devices.</p> : <div className={styles.storyList}>{stories.map(story => <article className={styles.story} key={story.id}><span className={styles.storyTheme}>{story.theme}</span><strong>{story.title}</strong><button className={styles.read} type="button" onClick={() => { window.sessionStorage.setItem('storysprout-open-story', JSON.stringify(story)); window.location.href = '/'; }}>Read story ↗</button><button className={styles.delete} type="button" onClick={() => deleteStory(story.id)}>Delete</button></article>)}</div>}</section></div></section></main>;
}
