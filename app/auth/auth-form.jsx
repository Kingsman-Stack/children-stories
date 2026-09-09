'use client';

import { useState } from 'react';
import { createClient } from '../../lib/supabase/client';

export default function AuthForm({ styles }) {
  const [mode, setMode] = useState('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    const supabase = createClient();
    const result = mode === 'sign-in' ? await supabase.auth.signInWithPassword({ email, password }) : await supabase.auth.signUp({ email, password });
    setBusy(false);
    if (result.error) { setMessage(result.error.message); return; }
    setMessage(mode === 'sign-in' ? 'Signed in. Redirecting...' : 'Account created. Check your email if confirmation is enabled.');
    if (mode === 'sign-in') window.location.href = '/';
  }

  return <form className={styles.form} onSubmit={submit}><label htmlFor="email">Parent email</label><input id="email" type="email" value={email} onChange={event => setEmail(event.target.value)} required autoComplete="email" /><label htmlFor="password">Password</label><input id="password" type="password" value={password} onChange={event => setPassword(event.target.value)} minLength={8} required autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'} /><button className={styles.submit} type="submit" disabled={busy}>{busy ? 'Please wait...' : mode === 'sign-in' ? 'Sign in' : 'Create parent account'} <span>↗</span></button>{message && <p className={styles.message} role="status">{message}</p>}<button className={styles.switch} type="button" onClick={() => { setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in'); setMessage(''); }}>{mode === 'sign-in' ? 'Need an account? Create one' : 'Already have an account? Sign in'}</button></form>;
}
