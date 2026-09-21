import { useEffect } from 'react';

import { sportsActions } from '@/features/sports/data/sportsStore';

/** Advance the calendar window while a Sports consumer is active. */
export function useSportsWindow(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    let timer: ReturnType<typeof setTimeout>;
    function updateDay() {
      const now = new Date();
      sportsActions.updateWindow(now);
      const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      timer = setTimeout(updateDay, midnight.getTime() - now.getTime());
    }
    updateDay();
    return () => clearTimeout(timer);
  }, [active]);
}
