/**
 * Framer Motion animation variants
 * @module presentation/lib/animations
 */

import type { Variants, Transition } from "framer-motion";

/**
 * Easing curves
 */
export const easeSpring: Transition["ease"] = [0.22, 1, 0.36, 1];

/**
 * Fade in from bottom
 */
export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 24 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: easeSpring },
  },
};

/**
 * Fade in from bottom with custom delay
 */
export const fadeInUpDelayed = (delay: number): Variants => ({
  initial: { opacity: 0, y: 24 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: easeSpring, delay },
  },
});

/**
 * Stagger children container
 */
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

/**
 * Scale in animation
 */
export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: easeSpring },
  },
  exit: { opacity: 0, scale: 0.95 },
};

/**
 * Slide in from right (drawer)
 */
export const slideInRight: Variants = {
  initial: { x: "100%", opacity: 0 },
  animate: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.35, ease: easeSpring },
  },
  exit: {
    x: "100%",
    opacity: 0,
    transition: { duration: 0.3, ease: easeSpring },
  },
};

/**
 * Slide in from bottom (mobile menu)
 */
export const slideInBottom: Variants = {
  initial: { y: "100%" },
  animate: {
    y: 0,
    transition: { duration: 0.35, ease: easeSpring },
  },
  exit: {
    y: "100%",
    transition: { duration: 0.3, ease: easeSpring },
  },
};

/**
 * Fade in overlay
 */
export const fadeOverlay: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

/**
 * Card hover animation
 */
export const cardHover = {
  whileHover: {
    y: -4,
    transition: { duration: 0.3, ease: "easeOut" },
  },
};

/**
 * Page transition
 */
export const pageTransition: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: easeSpring },
  },
};

/**
 * Grid item animation for product cards
 */
export const gridItem: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: easeSpring },
  },
};

/**
 * Toast animation
 */
export const toastSlide: Variants = {
  initial: { opacity: 0, y: 50, scale: 0.95 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.3, ease: easeSpring },
  },
  exit: {
    opacity: 0,
    y: 20,
    scale: 0.95,
    transition: { duration: 0.2 },
  },
};
