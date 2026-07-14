import { useState, useEffect, useCallback } from 'react';

interface UseAntiCheatProps {
  onForceSubmit: () => void;
  onWarning: (strikeCount: number) => void;
  isActive: boolean;
}

export function useAntiCheat({ onForceSubmit, onWarning, isActive }: UseAntiCheatProps) {
  const [strikeCount, setStrikeCount] = useState(0);

  const handleViolation = useCallback((e?: Event) => {
    if (!isActive) return;
    
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
