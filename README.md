# kappa closets 🩵

Your chapter's marketplace — formals, raids, furniture, subleases & more.

---

## Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Set up Firebase

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project (or use existing)
3. Click **Add App → Web** and copy your config
4. Enable **Authentication → Email/Password** sign-in method
5. Enable **Firestore Database** (start in test mode for now)

### 3. Add your Firebase config

Open `src/firebase.js` and replace the placeholder values with your actual Firebase config keys.

Alternatively, copy `.env.example` → `.env` and use environment variables instead.

### 4. Run the app
```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000) to see it.

---

## Project Structure

```
src/
  App.js                  # Root — shows Auth or Home based on login state
  firebase.js             # Firebase config ← EDIT THIS
  index.js / index.css    # Entry point + global CSS variables
  context/
    AuthContext.js        # Auth state, login, register, profile management
  pages/
    AuthPage.js           # Sign in / Create account screen
    HomePage.js           # Main marketplace page
  components/
    Header.js             # Sticky nav with search, post button, user dropdown
    Hero.js               # Hero section with title + stats
    TabBar.js             # Category tabs
    FilterBar.js          # Filter pills + sort
    ListingsGrid.js       # Card grid (sample data — wire to Firestore to go live)
    PostModal.js          # Post a new listing (saves to Firestore)
    ProfileModal.js       # Edit profile (saves to Firestore)
    Modal.module.css      # Shared modal styles
```

## Next Steps (when you're ready)

- **Replace sample listings** in `ListingsGrid.js` with a `useEffect` that reads from Firestore
- **Add image upload** via Firebase Storage in `PostModal.js`
- **Deploy** with `npm run build` then Firebase Hosting: `firebase deploy`
