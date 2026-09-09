import AuthForm from './auth-form';
import styles from './auth.module.css';

export default function AuthPage() {
  return <main className={styles.page}><a className={styles.brand} href="/">story<span>sprout</span></a><div className={styles.layout}><section className={styles.intro}><p className={styles.eyebrow}>A QUIET PLACE FOR BIG IMAGINATIONS</p><h1>Keep their<br /><em>wonder close.</em></h1><p>Sign in as a parent to save favorite adventures, return to familiar characters, and build a little library of stories made with love.</p><div className={styles.constellation}>· ✦ · · ✧ ·</div></section><section className={styles.card}><h2>Your story shelf</h2><p className={styles.cardIntro}>Parent or guardian access only. Children do not need an account.</p><AuthForm styles={styles} /><a className={styles.back} href="/">← Back to story studio</a></section></div></main>;
}
