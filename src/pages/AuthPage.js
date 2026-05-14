import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import styles from './AuthPage.module.css';

export default function AuthPage({ onGuest }) {
  const { login, register, resetPassword } = useAuth();
  const [mode, setMode] = useState('in'); // 'in' | 'up' | 'reset'
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    email: '', password: '',
    first: '', last: '', age: '', grade: '', pc: '',
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
      } catch (e) {
        setError('Could not send reset email. Check the address and try again.');
      } finally {
        setLoading(false);
      }
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
          first: form.first,
          last: form.last,
          age: form.age || '—',
          grade: form.grade,
          pc: form.pc || '—',
        });
      }
    } catch (e) {
      if (e.code === 'auth/user-not-found' || e.code === 'auth/invalid-credential') {
        setError('No account found — try joining!');
      } else if (e.code === 'auth/wrong-password') {
        setError('Incorrect password.');
      } else if (e.code === 'auth/email-already-in-use') {
        setError('Email already registered.');
      } else {
        setError(e.message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.screen}>
      <div className={styles.blob1} />
      <div className={styles.blob2} />
      <div className={styles.box}>
        <div className={styles.wordmark}>KAPPA KLOSETS</div>
        <div className={styles.tagline}>ready to buy, sell, and swap?</div>

        {mode !== 'reset' && (
          <div className={styles.toggle}>
            <button className={mode === 'in' ? styles.on : ''} onClick={() => { setMode('in'); setError(''); setResetSent(false); }}>Sign In</button>
            <button className={mode === 'up' ? styles.on : ''} onClick={() => { setMode('up'); setError(''); setResetSent(false); }}>Join</button>
          </div>
        )}

        {mode === 'reset' && (
          <div style={{ marginBottom: '18px' }}>
            <button onClick={() => { setMode('in'); setError(''); setResetSent(false); }} style={{ background: 'none', border: 'none', color: 'var(--periwinkle)', fontSize: '.82rem', cursor: 'pointer', padding: 0 }}>
              ← Back to Sign In
            </button>
            <div style={{ marginTop: '10px', fontSize: '1rem', fontWeight: 600, color: 'var(--ink)' }}>Reset your password</div>
            <div style={{ fontSize: '.82rem', color: 'var(--muted)', marginTop: '4px' }}>Enter your email and we'll send you a reset link.</div>
          </div>
        )}

        {mode === 'up' && (
          <div className={styles.f2}>
            <Field label="First Name" value={form.first} onChange={v => set('first', v)} placeholder="" />
            <Field label="Last Name" value={form.last} onChange={v => set('last', v)} placeholder="" />
          </div>
        )}

        <Field label="Email" type="email" value={form.email} onChange={v => set('email', v)} placeholder="" />
        {mode !== 'reset' && (
          <Field label="Password" type="password" value={form.password} onChange={v => set('password', v)} placeholder="" />
        )}
        {mode === 'in' && (
          <div style={{ textAlign: 'right', marginTop: '-8px', marginBottom: '10px' }}>
            <button onClick={() => { setMode('reset'); setError(''); setResetSent(false); }} style={{ background: 'none', border: 'none', color: 'var(--periwinkle)', fontSize: '.78rem', cursor: 'pointer', padding: 0 }}>
              Forgot password?
            </button>
          </div>
        )}

        {mode === 'up' && (
          <>
            <div className={styles.f2}>
              <Field label="Age" type="number" value={form.age} onChange={v => set('age', v)} placeholder="" />
              <div className={styles.field}>
                <label>Year</label>
                <select value={form.grade} onChange={e => set('grade', e.target.value)}>
                  <option value="">Select...</option>
                  <option>Freshman</option>
                  <option>Sophomore</option>
                  <option>Junior</option>
                  <option>Senior</option>
                  <option>Grad</option>
                </select>
              </div>
            </div>
            <Field label="PC" value={form.pc} onChange={v => set('pc', v)} placeholder="e.g. 22" />
          </>
        )}

        {onGuest && mode !== 'reset' && (
          <button
            onClick={onGuest}
            style={{ width:'100%', background:'none', border:'none', color:'var(--muted)', fontFamily:"'Geom',sans-serif", fontSize:'.78rem', cursor:'pointer', padding:'4px 0 10px', letterSpacing:'.04em' }}
          >
            Browse as guest
          </button>
        )}

        {resetSent ? (
          <div style={{ textAlign: 'center', padding: '14px 0', fontSize: '.9rem', color: 'var(--ink)' }}>
            Check your inbox! A reset link is on its way.
            <div style={{ fontSize: '.78rem', color: 'var(--muted)', marginTop: '6px' }}>Don't see it? Check your spam folder.</div>
          </div>
        ) : (
          <>
            {error && <div className={styles.err}>{error}</div>}
            <button
              className={styles.cta}
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Loading...' : mode === 'in' ? 'Sign In' : mode === 'up' ? 'Create Account' : 'Send Reset Link'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function Field({ label, type = 'text', value, onChange, placeholder }) {
  return (
    <div style={{ marginBottom: '13px' }}>
      <label style={{ display:'block', fontSize:'.68rem', letterSpacing:'.12em', textTransform:'uppercase', color:'var(--muted)', fontWeight:500, marginBottom:'5px' }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ width:'100%', background:'var(--mist)', border:'1px solid var(--border)', borderRadius:'10px', padding:'10px 14px', fontFamily:"'Geom',sans-serif", fontSize:'.9rem', color:'var(--ink)', outline:'none', fontWeight:300 }}
        onFocus={e => { e.target.style.borderColor = 'var(--periwinkle)'; e.target.style.background = 'var(--white)'; }}
        onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.background = 'var(--mist)'; }}
      />
    </div>
  );
}
