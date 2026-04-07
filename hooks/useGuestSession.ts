/**
 * Hook to manage guest session state with localStorage persistence.
 * Ensures that guest data is hydrated before the app consumes it.
 */

import { useState, useEffect } from 'react';
import { getGuestSession, saveGuestSession } from '@/lib/storage';
import type { GuestSession } from '@/lib/types';

export function useGuestSession() {
  const [guestData, setGuestData] = useState<GuestSession | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Read from localStorage on mount
    const saved = getGuestSession();
    if (saved) {
      setGuestData(saved);
    }
    setIsHydrated(true);
  }, []);

  const loginAsGuest = (data: GuestSession) => {
    setGuestData(data);
    saveGuestSession(data);
  };

  const logoutGuest = () => {
    setGuestData(null);
    localStorage.removeItem('macroday_session');
  };

  return { 
    guestData, 
    isGuest: !!guestData, 
    loginAsGuest, 
    logoutGuest, 
    isHydrated 
  };
}
