'use client';

import { useEffect } from 'react';

/** Progressive enhancement: content stays visible without JavaScript. */
export function ScrollReveal() {
  useEffect(() => {
    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const elements = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-visible');
          observer.unobserve(entry.target);
        }
      }
    }, { threshold: 0.08, rootMargin: '0px 0px -24px 0px' });
    for (const el of elements) {
      if (el.getBoundingClientRect().top < window.innerHeight * 0.85) continue;
      el.classList.add('reveal-pending');
      observer.observe(el);
    }
    return () => {
      observer.disconnect();
      for (const el of elements) el.classList.remove('reveal-pending');
    };
  }, []);
  return null;
}
