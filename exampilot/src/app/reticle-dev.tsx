'use client';
import { useEffect } from 'react';

export function ReticleDev() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    // Reticle needs its companion server (ws://localhost:4400) and a token to
    // be useful. Without a token configured, connecting just spams failed
    // WebSocket attempts against a server that isn't running — so opt in only
    // when NEXT_PUBLIC_RETICLE_TOKEN is set.
    const token = process.env.NEXT_PUBLIC_RETICLE_TOKEN;
    if (!token) return;
    void import('@reticlehq/react').then(({ reticle, install, registerCapabilities }) => {
      install();
      reticle.connect({ token });
      registerCapabilities({
        testids: [
          'bottom-nav-home',
          'bottom-nav-profile',
          'header-menu-button',
          'header-title',
          'sidebar-nav',
          'delete-plan-button'
        ],
        signals: [],
        stores: [],
      });
    });
  }, []);
  return null;
}
