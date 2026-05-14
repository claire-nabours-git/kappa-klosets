import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import styles from './AuthModal.module.css';

export default function AuthModal({ onGuest }) {
  const { login, register, resetPassword } = useAuth();
  const [mode, setMode]           = useState('in');
  const [error, setError]         = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [form, setForm] = useState({
    email: '', password: '', first: '', last: '', age: '', grade: '', pc: '',
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit() {
    setError('');
    if (mode === 'reset') {
      if (!form.email) return setError('Please enter your email.');
      setLoading(true);
      try {
        await resetPassword(form.email);
        setResetSent(true);
      } catch { setError('Could not send reset email. Check the address and try again.'); }
      finally { setLoading(false); }
      return;
    }
    if (!form.email || !form.password) return setError('Please fill in all fields.');
    setLoading(true);
    try {
      if (mode === 'in') {
        await login(form.email, form.password);
      } else {
        if (!form.first || !form.last) return setError('Name is required.');
        if (!form.grade) return setError('Please select your year.');
        await register(form.email, form.password, {
          first: form.first, last: form.last,
          age: form.age || '—', grade: form.grade, pc: form.pc || '—',
        });
      }
    } catch (e) {
      if (e.code === 'auth/user-not-found' || e.code === 'auth/invalid-credential') setError('No account found — try joining!');
      else if (e.code === 'auth/wrong-password') setError('Incorrect password.');
      else if (e.code === 'auth/email-already-in-use') setError('Email already registered.');
      else setError(e.message);
    } finally { setLoading(false); }
  }

  function switchMode(m) { setMode(m); setError(''); setResetSent(false); }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>

        <div className={styles.brand}>
          <div className={styles.brandHeart}>
            <svg viewBox="0 0 24 24" fill="#fff" width="20" height="20">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </div>
          <span className={styles.brandName}>KAPPA KLOSETS</span>
        </div>

        <div className={styles.tagline}>buy, sell &amp; swap</div>

        {mode === 'reset' ? (
          <>
            <button className={styles.backLink} onClick={() => switchMode('in')}>← back</button>
            <p className={styles.resetHint}>Enter your email and we'll send a reset link.</p>
          </>
        ) : (
          <div className={styles.toggle}>
            <button className={`${styles.toggleBtn} ${mode === 'in' ? styles.toggleOn : ''}`} onClick={() => switchMode('in')}>Sign In</button>
            <button className={`${styles.toggleBtn} ${mode === 'up' ? styles.toggleOn : ''}`} onClick={() => switchMode('up')}>Join</button>
          </div>
        )}

        {mode === 'up' && (
          <div className={styles.row}>
            <Field label="First" value={form.first} onChange={v => set('first', v)} />
            <Field label="Last" value={form.last} onChange={v => set('last', v)} />
          </div>
        )}

        <Field label="Email" type="email" value={form.email} onChange={v => set('email', v)} />

        {mode !== 'reset' && (
          <Field label="Password" type="password" value={form.password} onChange={v => set('password', v)} />
        )}

        {mode === 'in' && (
          <div className={styles.forgotRow}>
            <button className={styles.forgotLink} onClick={() => switchMode('reset')}>Forgot password?</button>
          </div>
        )}

        {mode === 'up' && (
          <>
            <div className={styles.row}>
              <Field label="Age" type="number" value={form.age} onChange={v => set('age', v)} />
              <div className={styles.fieldWrap}>
                <label className={styles.lbl}>Year</label>
                <select className={styles.input} value={form.grade} onChange={e => set('grade', e.target.value)}>
                  <option value="">Select…</option>
                  {['Freshman','Sophomore','Junior','Senior','Grad'].map(g => <option key={g}>{g}</option>)}
                </select>
              </div>
            </div>
            <Field label="PC" value={form.pc} onChange={v => set('pc', v)} placeholder="e.g. Fall '23" />
          </>
        )}

        {resetSent ? (
          <div className={styles.resetSent}>
            Check your inbox! Don't see it? Check spam 💌
          </div>
        ) : (
          <>
            {error && <div className={styles.err}>{error}</div>}
            <button className={styles.cta} onClick={handleSubmit} disabled={loading}>
              {loading ? 'Loading…' : mode === 'in' ? 'Sign In' : mode === 'up' ? 'Create Account' : 'Send Reset Link'}
            </button>
          </>
        )}

        <button className={styles.guestBtn} onClick={onGuest}>Browse as guest</button>
      </div>
    </div>
  );
}

function Field({ label, type = 'text', value, onChange, placeholder }) {
  return (
    <div className={styles.fieldWrap}>
      <label className={styles.lbl}>{label}</label>
      <input
        type={type} value={value} placeholder={placeholder || ''}
        onChange={e => onChange(e.target.value)}
        className={styles.input}
      />
    </div>
  );
}
