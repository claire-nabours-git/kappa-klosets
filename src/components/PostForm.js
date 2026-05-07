import React, { useState } from "react";
import styles from "./Form.module.css";

export default function PostForm({ onSubmit, onCancel }) {
  const [title, setTitle]       = useState("");
  const [category, setCategory] = useState("Formals");
  const [price, setPrice]       = useState("");
  const [size, setSize]         = useState("");
  const [condition, setCond]    = useState("Like New");
  const [desc, setDesc]         = useState("");
  const [loading, setLoading]   = useState(false);

  async function handle(e) {
    e.preventDefault();
    if (!title || !price) return;
    setLoading(true);
    await onSubmit({
      title,
      category: category.toLowerCase(),
      price: Number(price),
      size: size || "—",
      condition,
      description: desc,
      emoji: categoryEmoji(category),
    });
    setLoading(false);
  }

  return (
    <form onSubmit={handle}>
      <F label="Item Name"><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Blue Dress" required /></F>
      <div className={styles.row2}>
        <F label="Category">
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {["Formals","Raids","Furniture","Subleasing","Accessories","Other"].map((c) => <option key={c}>{c}</option>)}
          </select>
        </F>
        <F label="Price ($)"><input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0" required /></F>
      </div>
      <div className={styles.row2}>
        <F label="Size"><input value={size} onChange={(e) => setSize(e.target.value)} placeholder="XS / 6 / N/A" /></F>
        <F label="Condition">
          <select value={condition} onChange={(e) => setCond(e.target.value)}>
            {["Brand New","Good","Fair"].map((c) => <option key={c}>{c}</option>)}
          </select>
        </F>
      </div>
      <F label="Description">
        <textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Brand, color, any details..." rows={3} />
      </F>
      <button className={styles.cta} type="submit" disabled={loading}>
        {loading ? "Posting…" : "Post Listing"}
      </button>
    </form>
  );
}

function F({ label, children }) {
  return (
    <div className={styles.field}>
      <label>{label}</label>
      {children}
    </div>
  );
}

function categoryEmoji(cat) {
  return { Formals:"👗", Raids:"⚡", Furniture:"🛋️", Subleasing:"🏠", Accessories:"💎", Other:"✨" }[cat] || "✨";
}
