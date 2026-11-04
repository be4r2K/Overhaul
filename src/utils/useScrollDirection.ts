import { useState, useEffect, useRef } from 'react';

export interface ScrollBarVisibility {
  showTopBar: boolean;
  showBottomBar: boolean;
}

/**
 * Scroll-aware visibility hook for the Top Header Bar and Bottom Navigation Bar:
 * - Scroll Down: Smoothly collapses both top and bottom navigation bars.
 * - Scroll Up: Restores the bottom navigation bar immediately.
 * - Scroll at Top (scrollTop === 0): Restores the top "Overhaul" header on Dashboard (and bottom bar).
 */
export function useScrollDirection(activeTab: string): ScrollBarVisibility {
  const [showTopBar, setShowTopBar] = useState(true);
  const [showBottomBar, setShowBottomBar] = useState(true);
  const lastScrollTopMap = useRef<WeakMap<EventTarget, number>>(new WeakMap());
  const touchStartYRef = useRef<number | null>(null);
  const lastToggleTimeRef = useRef<number>(0);

  useEffect(() => {
    setShowTopBar(true);
    setShowBottomBar(true);
  }, [activeTab]);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.classList.toggle('nav-bars-hidden', activeTab === 'settings' && !showBottomBar);
    }
  }, [activeTab, showBottomBar]);

  useEffect(() => {
    // Strictly keep TopBar ("Overhaul") and BottomNav permanently pinned on all tabs EXCEPT Settings
    if (activeTab !== 'settings') {
      setShowTopBar(true);
      setShowBottomBar(true);
      return;
    }

    const setBarsVisible = (visible: boolean) => {
      const now = Date.now();
      if (now - lastToggleTimeRef.current < 260) return;
      lastToggleTimeRef.current = now;
      setShowTopBar(visible);
      setShowBottomBar(visible);
    };

    const handleScroll = (event: Event) => {
      const target = event.target;
      if (!target) return;

      let currentScrollTop = 0;
      if (target === document || target === window) {
        currentScrollTop = window.scrollY || document.documentElement.scrollTop || 0;
      } else if (target instanceof HTMLElement) {
        if (target.closest('.glass-modal, .modal-content, .dialog-sheet')) return;
        if (target.scrollHeight <= target.clientHeight + 2) return;
        currentScrollTop = target.scrollTop;
      } else {
        return;
      }

      const prevScrollTop = lastScrollTopMap.current.get(target) ?? 0;
      const delta = currentScrollTop - prevScrollTop;
      lastScrollTopMap.current.set(target, Math.max(0, currentScrollTop));

      // At very top of Settings: always restore both TopBar and BottomNav
      if (currentScrollTop <= 8) {
        setShowTopBar(true);
        setShowBottomBar(true);
        return;
      }

      // Scroll Down in Settings: hide top and bottom bars
      if (delta > 3 && currentScrollTop > 12) {
        setBarsVisible(false);
      }
      // Scroll Up in Settings: restore top and bottom bars
      else if (delta < -3) {
        setBarsVisible(true);
      }
    };

    const handleWheel = (event: WheelEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && target.closest('.glass-modal, .modal-content, .dialog-sheet')) return;
      if (event.deltaY > 6) {
        setBarsVisible(false);
      } else if (event.deltaY < -6) {
        setBarsVisible(true);
      }
    };

    const handleTouchStart = (event: TouchEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && target.closest('.glass-modal, .modal-content, .dialog-sheet')) return;
      if (event.touches.length > 0) {
        touchStartYRef.current = event.touches[0].clientY;
      }
    };

    const handleTouchMove = (event: TouchEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && target.closest('.glass-modal, .modal-content, .dialog-sheet')) return;
      if (touchStartYRef.current === null || event.touches.length === 0) return;

      const currentY = event.touches[0].clientY;
      const dy = touchStartYRef.current - currentY; // positive = finger moving up (scrolling down)

      if (dy > 14) {
        setBarsVisible(false);
        touchStartYRef.current = currentY;
      } else if (dy < -12) {
        setBarsVisible(true);
        touchStartYRef.current = currentY;
      }
    };

    window.addEventListener('scroll', handleScroll, { capture: true, passive: true });
    window.addEventListener('wheel', handleWheel, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll, { capture: true } as EventListenerOptions);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      if (typeof document !== 'undefined') {
        document.body.classList.remove('nav-bars-hidden');
      }
    };
  }, [activeTab]);

  if (activeTab !== 'settings') {
    return { showTopBar: true, showBottomBar: true };
  }

  return { showTopBar, showBottomBar };
}
