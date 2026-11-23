"use client";

import { useEffect } from "react";

/**
 * Juss & Co-inspired motion, translated into AYURE's own editorial visual canon.
 * Nothing is hidden until IntersectionObserver is ready. Reduced-motion users
 * see every section immediately, with no parallax or entrance transitions.
 */
export default function AyureMotion() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!("IntersectionObserver" in window)) return;

    const selectors = [
      ".hero-copy .eyebrow",
      ".hero-copy h1",
      ".hero-lede",
      ".search-surface",
      ".cards > .card",
      ".strip",
      ".how-heading",
      ".steps li",
      ".pros-copy",
      ".pros-features .feature",
      ".scenic-copy",
    ];

    const elements = selectors.flatMap((selector) =>
      Array.from(document.querySelectorAll<HTMLElement>(selector)),
    );
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("ayure-in-view");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -5% 0px" },
    );

    elements.forEach((element) => {
      element.classList.add("ayure-reveal");
      observer.observe(element);
    });
    document.documentElement.classList.add("ayure-motion-ready");

    const heroImage = document.querySelector<HTMLImageElement>(".hero-photo img");
    let frame = 0;
    const updateParallax = () => {
      frame = 0;
      if (!heroImage) return;
      const hero = heroImage.closest(".hero-photo");
      if (!hero) return;
      const rect = hero.getBoundingClientRect();
      const displacement = Math.max(-20, Math.min(24, rect.top * -0.075));
      heroImage.style.transform = `translate3d(0, ${displacement}px, 0) scale(1.07)`;
    };
    const scheduleParallax = () => {
      if (!frame) frame = window.requestAnimationFrame(updateParallax);
    };
    scheduleParallax();
    window.addEventListener("scroll", scheduleParallax, { passive: true });
    window.addEventListener("resize", scheduleParallax, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", scheduleParallax);
      window.removeEventListener("resize", scheduleParallax);
      if (frame) window.cancelAnimationFrame(frame);
      if (heroImage) heroImage.style.removeProperty("transform");
      document.documentElement.classList.remove("ayure-motion-ready");
      elements.forEach((element) => element.classList.remove("ayure-reveal", "ayure-in-view"));
    };
  }, []);

  return null;
}
