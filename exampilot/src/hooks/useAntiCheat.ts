import { useState, useEffect, useCallback, useRef } from 'react';

interface UseAntiCheatProps {
  onForceSubmit: () => void;
  onWarning: (strikeCount: number) => void;
  isActive: boolean;
}

// Grace window after the exam becomes active during which tab/visibility changes
// are NOT penalized. The exam mounts inside redirects and dynamic imports that
// can fire an initial `visibilitychange`, and a candidate may briefly bounce
// focus while settling in. Without this, load-time noise costs a real strike.
const STARTUP_GRACE_MS = 2000;

export function useAntiCheat({ onForceSubmit, onWarning, isActive }: UseAntiCheatProps) {
  const [strikeCount, setStrikeCount] = useState(0);
  const activeSinceRef = useRef<number>(0);

  const handleViolation = useCallback((e?: Event) => {
    if (!isActive) return;

    // Ignore violations during the startup grace window.
    if (activeSinceRef.current && Date.now() - activeSinceRef.current < STARTUP_GRACE_MS) {
      return;
    }

    if (e && e.cancelable) {
      e.preventDefault();
    }

    setStrikeCount(prev => {
      const nextStrike = prev + 1;

      if (nextStrike >= 3) {
        onForceSubmit();
      } else {
        onWarning(nextStrike);
      }

      return nextStrike;
    });
  }, [isActive, onForceSubmit, onWarning]);

  useEffect(() => {
    if (!isActive) return;

    // Stamp when the exam became active so the grace window is measured from here.
    activeSinceRef.current = Date.now();

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleViolation();
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      handleViolation(e);
    };

    const handleCopy = (e: ClipboardEvent) => {
      handleViolation(e);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopy);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopy);
    };
  }, [isActive, handleViolation]);

  return { strikeCount };
}
