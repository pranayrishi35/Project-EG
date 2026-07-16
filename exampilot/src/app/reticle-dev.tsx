'use client';
import { useEffect } from 'react';

export function ReticleDev() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    void import('@reticlehq/react').then(({ reticle, install, registerCapabilities }) => {
      install();
      const token = process.env.NEXT_PUBLIC_RETICLE_TOKEN;
      reticle.connect(token ? { token } : {});
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
