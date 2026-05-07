import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { TOP_CATS } from '../pages/DiscoverPage';
import styles from './Modal.module.css';

const POST_TOP_CATS = TOP_CATS.filter(t => t.id !== 'free');

function compressImage(file) {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = () => {
        const MAX = 800;
        const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
        const canvas = document.createElement('canvas');
        canvas.width  = Math.round(img.width  * ratio);
        canvas.height = Math.round(img.height * ratio);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.78));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function PostModal({ onClose }) {
  const { currentUser, userProfile } = useAuth();
  const [form, setForm] = useState({
    title: '', categories: [], price: '', size: '', color: '—', condition: 'Brand New', description: '',
  });
  const [photos, setPhotos]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const fileRef = useRef(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  function toggleCategory(id) {
    setForm(f => ({
      ...f,
      categories: f.categories.includes(id)
        ? f.categories.filter(c => c !== id)
        : [...f.categories, id],
    }));
  }

  async function handlePhoto(e) {
    const files = Array.from(e.target.files).slice(0, 5 - photos.length);
    const compressed = await Promise.all(files.map(compressImage));
    setPhotos(prev => [...prev, ...compressed]);
    e.target.value = '';
  }

  function removePhoto(i) {
    setPhotos(ps => ps.filter((_, j) => j !== i));
  }

  async function handlePost() {
    if (!form.title || !form.price || photos.length === 0 || form.categories.length === 0) return;
    setLoading(true);
    try {
      // Derive top-level categories from selected sub-categories
      const topCategories = [...new Set(
        form.categories.map(catId =>
          POST_TOP_CATS.find(t => t.subs.some(s => s.id === catId))?.id
        ).filter(Boolean)
      )];
      // Primary category (first selected) for backward compat
      const primarySub = POST_TOP_CATS.flatMap(t => t.subs).find(s => s.id === form.categories[0]);

      await addDoc(collection(db, 'listings'), {
        title:          form.title,
        description:    form.description,
        price:          Number(form.price),
        size:           form.size,
        color:          form.color,
        condition:      form.condition,
        categories:     form.categories,
        topCategories,
        category:       form.categories[0] || '',
        categoryLabel:  primarySub?.label || form.categories[0] || '',
        photos,
        imageUrl:       photos[0],
        likeCount:      0,
        sellerUid:      currentUser.uid,
        sellerName:     `${userProfile?.first || ''} ${userProfile?.last?.[0] || ''}.`.trim(),
        sellerInitials: (userProfile?.first?.[0] || '') + (userProfile?.last?.[0] || ''),
        createdAt:      serverTimestamp(),
      });
      setSuccess(true);
      setTimeout(onClose, 1200);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <button className={styles.x} onClick={onClose}>✕</button>
        <div className={styles.title}>New Listing</div>
        <div className={styles.sub}>drop your item for the chapter</div>

        {success ? (
          <div className={styles.success}>Posted!</div>
        ) : (
          <>
            {/* Photos */}
            <div className={styles.fieldWrap}>
              <label className={styles.lbl}>
                Photos <span className={styles.req}>*</span>
                <span className={styles.photoCount}>{photos.length}/5</span>
              </label>
              <div className={styles.photoRow}>
                {photos.map((p, i) => (
                  <div key={i} className={styles.photoThumb}>
                    <img src={p} alt="" />
                    {i === 0 && <span className={styles.coverLabel}>Cover</span>}
                    <button className={styles.photoRemove} onClick={() => removePhoto(i)}>✕</button>
                  </div>
                ))}
                {photos.length < 5 && (
                  <div className={styles.photoAdd} onClick={() => fileRef.current.click()}>
                    <span className={styles.photoAddPlus}>+</span>
                    <span className={styles.photoAddLbl}>Add</span>
                  </div>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handlePhoto} />
            </div>

            <Field label="Item Name" value={form.title} onChange={v => set('title', v)} placeholder="e.g. Navy formal gown, size 4" />

            {/* Multi-select category chips */}
            <div className={styles.fieldWrap}>
              <label className={styles.lbl}>
                Categories <span className={styles.req}>*</span>
                {form.categories.length > 0 && (
                  <span className={styles.photoCount}>{form.categories.length} selected</span>
                )}
              </label>
              {POST_TOP_CATS.map(top => (
                <div key={top.id} className={styles.catSection}>
                  <div className={styles.catSectionLabel}>{top.label}</div>
                  <div className={styles.catChips}>
                    {top.subs.map(sub => (
                      <button
                        key={sub.id}
                        type="button"
                        className={`${styles.catChip} ${form.categories.includes(sub.id) ? styles.catChipOn : ''}`}
                        onClick={() => toggleCategory(sub.id)}
                      >
                        {sub.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.row}>
              <Field label="Price ($)" type="number" value={form.price} onChange={v => set('price', v)} placeholder="0 for free" />
              <Field label="Size" value={form.size} onChange={v => set('size', v)} placeholder="XS / 6 / N/A" />
            </div>
            <div className={styles.row}>
              <SelectField label="Color" value={form.color} onChange={v => set('color', v)}
                options={['—','Black','White','Blue','Pink','Red','Green','Yellow','Purple','Gold','Silver','Multi']} />
              <SelectField label="Condition" value={form.condition} onChange={v => set('condition', v)}
                options={['Brand New','Like New','Good','Fair']} />
            </div>
            <div className={styles.fieldWrap}>
              <label className={styles.lbl}>Description</label>
              <textarea
                className={styles.textarea}
                value={form.description}
                onChange={e => set('description', e.target.value)}
                placeholder="Brand, color, any details..."
              />
            </div>
            <button
              className={styles.cta}
              onClick={handlePost}
              disabled={loading || !form.title || !form.price || photos.length === 0 || form.categories.length === 0}
            >
              {loading ? 'Posting...' : 'Post Listing'}
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
function SelectField({ label, value, onChange, options }) {
  return (
    <div className={styles.fieldWrap}>
      <label className={styles.lbl}>{label}</label>
      <select className={styles.input} value={value} onChange={e => onChange(e.target.value)}>
        {options.map(o => <option key={o}>{o}</option>)}
      </select>
    </div>
  );
}
