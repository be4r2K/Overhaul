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
  const activeScrollTopRef = useRef<number>(0);

  useEffect(() => {
    setShowTopBar(true);
    setShowBottomBar(true);
    activeScrollTopRef.current = 0;
  }, [activeTab]);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.classList.toggle('nav-bars-hidden', !showBottomBar);
    }
  }, [showBottomBar]);

  useEffect(() => {
    const handleScroll = (event: Event) => {
      const target = event.target;
      if (!target) return;

      let currentScrollTop = 0;
      if (target === document || target === window) {
        currentScrollTop = window.scrollY || document.documentElement.scrollTop || 0;
      } else if (target instanceof HTMLElement) {
        if (target.scrollHeight <= target.clientHeight + 2) return;
        currentScrollTop = target.scrollTop;
      } else {
        return;
      }

      activeScrollTopRef.current = currentScrollTop;
      const prevScrollTop = lastScrollTopMap.current.get(target) ?? 0;
      const delta = currentScrollTop - prevScrollTop;

      // Scroll at Top (scrollTop === 0): restore top header on Dashboard and bottom bar
      if (currentScrollTop <= 2) {
        setShowTopBar(true);
        setShowBottomBar(true);
        lastScrollTopMap.current.set(target, 0);
        return;
      }

      // Scroll Down: smoothly collapse top and bottom navigation bars
      if (delta > 3 && currentScrollTop > 6) {
        setShowTopBar(false);
        setShowBottomBar(false);
        lastScrollTopMap.current.set(target, currentScrollTop);
      }
      // Scroll Up: restore bottom navigation bar (and top header if at top)
      else if (delta < -3) {
        setShowBottomBar(true);
        if (currentScrollTop <= 4) {
          setShowTopBar(true);
        }
        lastScrollTopMap.current.set(target, currentScrollTop);
      }
    };

    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY > 10) {
        setShowTopBar(false);
        setShowBottomBar(false);
      } else if (e.deltaY < -8) {
        setShowBottomBar(true);
        if (activeScrollTopRef.current <= 4) {
          setShowTopBar(true);
        }
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches && e.touches.length === 1) {
        touchStartYRef.current = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (touchStartYRef.current === null || !e.touches || e.touches.length !== 1) return;
      const currentY = e.touches[0].clientY;
      const dy = touchStartYRef.current - currentY; // positive = finger moving up (scrolling down)
      if (dy > 18) {
        setShowTopBar(false);
        setShowBottomBar(false);
        touchStartYRef.current = currentY;
      } else if (dy < -14) {
        setShowBottomBar(true);
        if (activeScrollTopRef.current <= 4) {
          setShowTopBar(true);
        }
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
  }, []);

  return { showTopBar, showBottomBar };
}
