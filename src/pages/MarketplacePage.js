import React, { useState, useEffect } from "react";
import { signOut } from "firebase/auth";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase";
import Header from "../components/Header";
import Hero from "../components/Hero";
import Tabs from "../components/Tabs";
import FilterBar from "../components/FilterBar";
import ListingsGrid from "../components/ListingsGrid";
import Modal from "../components/Modal";
import PostForm from "../components/PostForm";
import ProfileForm from "../components/ProfileForm";
import styles from "./MarketplacePage.module.css";

const TABS = [
  { key: "all", label: "All" },
  { key: "formals", label: "Formals" },
  { key: "raids", label: "Raids" },
  { key: "furniture", label: "Furniture" },
  { key: "subleasing", label: "Subleasing" },
  { key: "accessories", label: "Accessories" },
];

// Seed listings shown before any real data loads
const SEED = [
  { id: "s1", title: "Dusty Blue Satin Gown",     category: "formals",     size: "4",   condition: "Like New", price: 45,      seller: "Ava K.",    emoji: "👗" },
  { id: "s2", title: "Ice Blue Sequin Mini",       category: "formals",     size: "S",   condition: "Worn once",price: 55,      seller: "Mia R.",    emoji: "✨" },
  { id: "s3", title: "Electric Blue Bodysuit",     category: "raids",       size: "M",   condition: "Good",    price: 18,      seller: "Sophia L.", emoji: "⚡" },
  { id: "s4", title: "Powder Blue Desk Chair",     category: "furniture",   size: "—",   condition: "Great",   price: 65,      seller: "Chloe T.",  emoji: "🛋️" },
  { id: "s5", title: "1BR Near Campus — Summer",   category: "subleasing",  size: "—",   condition: "—",       price: 750,     seller: "Lily P.",   emoji: "🏠", priceLabel: "$750/mo" },
  { id: "s6", title: "Silver Strappy Heels",       category: "formals",     size: "7",   condition: "Worn once",price: 28,     seller: "Emma W.",   emoji: "👠" },
  { id: "s7", title: "Sapphire Drop Earrings",     category: "accessories", size: "—",   condition: "Like New", price: 14,     seller: "Nora B.",   emoji: "💎" },
  { id: "s8", title: "Cowboys & Aliens Set",       category: "raids",       size: "XS–S",condition: "Good",    price: 22,      seller: "Grace H.",  emoji: "🎉" },
];

export default function MarketplacePage({ user }) {
  const [activeTab, setActiveTab]   = useState("all");
  const [search, setSearch]         = useState("");
  const [modal, setModal]           = useState(null); // null | "post" | "profile"
  const [listings, setListings]     = useState(SEED);

  // Subscribe to Firestore listings in real-time
  useEffect(() => {
    const q = query(collection(db, "listings"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        const live = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setListings([...live, ...SEED]);
      }
    });
    return unsub;
  }, []);

  async function handlePost(data) {
    await addDoc(collection(db, "listings"), {
      ...data,
      seller: user.displayName || user.email,
      uid: user.uid,
      createdAt: serverTimestamp(),
    });
    setModal(null);
  }

  const filtered = listings.filter((l) => {
    const matchTab = activeTab === "all" || l.category === activeTab;
    const matchSearch = l.title.toLowerCase().includes(search.toLowerCase()) ||
                        (l.seller || "").toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const tabCounts = TABS.reduce((acc, t) => {
    acc[t.key] = t.key === "all" ? listings.length : listings.filter((l) => l.category === t.key).length;
    return acc;
  }, {});

  return (
    <div className={styles.page}>
      <Header
        user={user}
        search={search}
        onSearch={setSearch}
        onPost={() => setModal("post")}
        onEditProfile={() => setModal("profile")}
        onSignOut={() => signOut(auth)}
      />

      <Hero listingCount={listings.length} />

      <Tabs tabs={TABS} active={activeTab} counts={tabCounts} onSwitch={setActiveTab} />

      <FilterBar />

      <main className={styles.main}>
        <div className={styles.gridHead}>
          <span className={styles.gridTitle}>
            {TABS.find((t) => t.key === activeTab)?.label || "All Listings"}
          </span>
          <span className={styles.gridCount}>{filtered.length} items</span>
        </div>
        <ListingsGrid listings={filtered} />
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <span className={styles.footWord}>kappa <em>closets</em></span>
          <span className={styles.footCopy}>Buy, sell &amp; swap.</span>
        </div>
      </footer>

      {/* POST MODAL */}
      <Modal open={modal === "post"} onClose={() => setModal(null)} title="New Listing" sub="drop your item for the chapter">
        <PostForm onSubmit={handlePost} onCancel={() => setModal(null)} />
      </Modal>

      {/* PROFILE MODAL */}
      <Modal open={modal === "profile"} onClose={() => setModal(null)} title="Edit Profile" sub="update your chapter info">
        <ProfileForm user={user} onClose={() => setModal(null)} />
      </Modal>
    </div>
  );
}
