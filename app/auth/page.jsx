import AuthForm from './auth-form';

export default function AuthPage() {
  return <main className="auth-shell"><a className="brand" href="/">story<span>sprout</span></a><section className="auth-card"><p className="eyebrow">FOR PARENTS AND GUARDIANS</p><h1>Your family story shelf</h1><p className="auth-copy">Create an account to keep stories safe and available across your devices.</p><AuthForm /></section></main>;
}
