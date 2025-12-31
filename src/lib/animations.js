import { motion } from 'framer-motion';

// Animation variants for consistent animations across the app
export const fadeIn = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
};

export const slideUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
};

export const slideDown = {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
};

export const slideLeft = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
};

export const slideRight = {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
};

export const scaleIn = {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 },
};

export const staggerContainer = {
    animate: {
        transition: {
            staggerChildren: 0.1,
        },
    },
};

export const staggerItem = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
};

// Transition presets
export const springTransition = {
    type: 'spring',
    damping: 25,
    stiffness: 300,
};

export const smoothTransition = {
    duration: 0.3,
    ease: 'easeInOut',
};

// Hover animations
export const hoverScale = {
    scale: 1.05,
    transition: { duration: 0.2 },
};

export const hoverGlow = {
    boxShadow: '0 0 20px rgba(14, 165, 233, 0.5)',
    transition: { duration: 0.2 },
};

// Loading animations
export const pulseAnimation = {
    scale: [1, 1.05, 1],
    opacity: [0.5, 1, 0.5],
    transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
    },
};

export const spinAnimation = {
    rotate: 360,
    transition: {
        duration: 1,
        repeat: Infinity,
        ease: 'linear',
    },
};

export default {
    fadeIn,
    slideUp,
    slideDown,
    slideLeft,
    slideRight,
    scaleIn,
    staggerContainer,
    staggerItem,
    springTransition,
    smoothTransition,
    hoverScale,
    hoverGlow,
    pulseAnimation,
    spinAnimation,
};
