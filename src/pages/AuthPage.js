import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import styles from './AuthPage.module.css';

export default function AuthPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('in'); // 'in' | 'up'
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    email: '', password: '',
    first: '', last: '', age: '', grade: '', pc: '',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit() {
    setError('');
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
        <div className={styles.tagline}>UCLA KKG's collective closet</div>

        <div className={styles.toggle}>
          <button className={mode === 'in' ? styles.on : ''} onClick={() => setMode('in')}>Sign In</button>
          <button className={mode === 'up' ? styles.on : ''} onClick={() => setMode('up')}>Join</button>
        </div>

        {mode === 'up' && (
          <div className={styles.f2}>
            <Field label="First Name" value={form.first} onChange={v => set('first', v)} placeholder="" />
            <Field label="Last Name" value={form.last} onChange={v => set('last', v)} placeholder="" />
          </div>
        )}

        <Field label="Email" type="email" value={form.email} onChange={v => set('email', v)} placeholder="" />
        <Field label="Password" type="password" value={form.password} onChange={v => set('password', v)} placeholder="" />

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

        {error && <div className={styles.err}>{error}</div>}
        <button
          className={styles.cta}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? 'Loading...' : mode === 'in' ? 'Sign In' : 'Create Account'}
        </button>
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
