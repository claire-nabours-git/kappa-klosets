import React, { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import styles from "./Form.module.css";

export default function ProfileForm({ user, onClose }) {
  const [first, setFirst]   = useState("");
  const [last, setLast]     = useState("");
  const [age, setAge]       = useState("");
  const [grade, setGrade]   = useState("Freshman");
  const [pc, setPC]         = useState("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved]   = useState(false);

  useEffect(() => {
    getDoc(doc(db, "users", user.uid)).then((snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setFirst(d.first || ""); setLast(d.last || "");
        setAge(d.age !== "—" ? d.age : "");
        setGrade(d.grade || "Freshman");
        setPC(d.pc !== "—" ? d.pc : "");
      }
    });
  }, [user.uid]);

  async function handle(e) {
    e.preventDefault();
    setLoading(true);
    await setDoc(doc(db, "users", user.uid), { first, last, age: age || "—", grade, pc: pc || "—", email: user.email }, { merge: true });
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 800);
    setLoading(false);
  }

  return (
    <form onSubmit={handle}>
      <div className={styles.row2}>
        <F label="First Name"><input value={first} onChange={(e) => setFirst(e.target.value)} /></F>
        <F label="Last Name"><input value={last} onChange={(e) => setLast(e.target.value)} /></F>
      </div>
      <div className={styles.row2}>
        <F label="Age"><input type="number" value={age} onChange={(e) => setAge(e.target.value)} min="17" max="30" /></F>
        <F label="Year">
          <select value={grade} onChange={(e) => setGrade(e.target.value)}>
            {["Freshman","Sophomore","Junior","Senior","Grad"].map((g) => <option key={g}>{g}</option>)}
          </select>
        </F>
      </div>
      <F label="Pledge Class (PC)">
        <input value={pc} onChange={(e) => setPC(e.target.value)} placeholder="e.g. Fall '23 · Alpha Beta" />
      </F>
      <button className={styles.cta} type="submit" disabled={loading}>
        {saved ? "Saved ✓" : loading ? "Saving…" : "Save Changes"}
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
