import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import HomePage from './pages/HomePage';
import AuthModal from './components/AuthModal';
import LoginPromptModal from './components/LoginPromptModal';

function AppInner() {
  const { currentUser } = useAuth();
  const [isGuest, setIsGuest]           = useState(false);
  const [promptAction, setPromptAction] = useState(null);

  function requireAuth(action) {
    setPromptAction(action || 'do that');
  }

  return (
    <>
      <HomePage isGuest={!currentUser} requireAuth={requireAuth} />

      {!currentUser && !isGuest && (
        <AuthModal onGuest={() => setIsGuest(true)} />
      )}

      {promptAction && (
        <LoginPromptModal
          action={promptAction}
          onAuth={() => { setIsGuest(false); setPromptAction(null); }}
          onClose={() => setPromptAction(null)}
        />
      )}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
