import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import styles from './Modal.module.css';

export default function ProfileModal({ onClose }) {
  const { currentUser, userProfile, updateProfile } = useAuth();
  const [form, setForm] = useState({
    first: userProfile?.first || '',
    last: userProfile?.last || '',
    age: userProfile?.age !== '—' ? userProfile?.age : '',
    grade: userProfile?.grade || 'Freshman',
    pc: userProfile?.pc !== '—' ? userProfile?.pc : '',
    venmo: userProfile?.venmo || '',
  });
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(userProfile?.photoUrl || null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const fileRef = useRef(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  function handlePhoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      // Compress to max 200x200 via canvas before storing
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = Math.min(img.width, img.height);
        canvas.width = 200; canvas.height = 200;
        const ctx = canvas.getContext('2d');
        const sx = (img.width - size) / 2;
        const sy = (img.height - size) / 2;
        ctx.drawImage(img, sx, sy, size, size, 0, 0, 200, 200);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        setPhoto(dataUrl);
        setPreview(dataUrl);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    if (!currentUser) return;
    setSaving(true);
    setError(null);
    try {
      await updateProfile({
        first: form.first || userProfile?.first,
        last: form.last || userProfile?.last,
        age: form.age || '—',
        grade: form.grade,
        pc: form.pc || '—',
        venmo: form.venmo.replace('@', '').trim() || '',
        ...(photo && { photoUrl: photo }),
      });
      setSaved(true);
      setTimeout(onClose, 900);
    } catch (e) {
      setError(e?.message || 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  }

  const initials = (userProfile?.first?.[0] || '') + (userProfile?.last?.[0] || '');

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <button className={styles.x} onClick={onClose}>✕</button>
        <div className={styles.title}>Edit Profile</div>
        <div className={styles.sub}>update your info</div>

        {saved ? (
          <div className={styles.success}>✓ Saved!</div>
        ) : (
          <>
            <div className={styles.avatarWrap}>
              <div className={styles.avatarRing} onClick={() => fileRef.current.click()}>
                {preview
                  ? <img src={preview} alt="profile" className={styles.avatarImg} />
                  : <span className={styles.avatarInitials}>{initials || '?'}</span>
                }
                <div className={styles.avatarOverlay}>edit</div>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handlePhoto}
              />
            </div>

            {error && <div className={styles.errorMsg}>{error}</div>}

            <div className={styles.row}>
              <Field label="First Name" value={form.first} onChange={v => set('first', v)} />
              <Field label="Last Name" value={form.last} onChange={v => set('last', v)} />
            </div>
            <div className={styles.row}>
              <Field label="Age" type="number" value={form.age} onChange={v => set('age', v)} />
              <div className={styles.fieldWrap}>
                <label className={styles.lbl}>Year</label>
                <select className={styles.input} value={form.grade} onChange={e => set('grade', e.target.value)}>
                  {['Freshman','Sophomore','Junior','Senior','Grad'].map(g => <option key={g}>{g}</option>)}
                </select>
              </div>
            </div>
            <Field label="PC" value={form.pc} onChange={v => set('pc', v)} placeholder="e.g. Fall '23 · Alpha Beta" />
            <Field label="Venmo" value={form.venmo} onChange={v => set('venmo', v)} placeholder="@username" />
            <button className={styles.cta} onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function Field({ label, type = 'text', value, onChange, placeholder }) {
  return (
    <div className={styles.fieldWrap}>
      <label className={styles.lbl}>{label}</label>
      <input type={type} className={styles.input} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}
