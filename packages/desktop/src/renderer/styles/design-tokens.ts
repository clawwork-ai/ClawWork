export const STAGGER_STEP = 0.03;

export const motionDuration = {
  fast: 0.1,
  normal: 0.15,
  moderate: 0.2,
  slow: 0.3,
} as const;

export const motionEase = {
  standard: [0.2, 0, 0, 1],
  enter: [0, 0, 0.2, 1],
  exit: [0.4, 0, 1, 1],
} as const;

export const motionSpring = {
  snappy: { type: 'spring', bounce: 0.15, duration: 0.4 },
} as const;

export type MotionDurationToken = keyof typeof motionDuration;
export type MotionEaseToken = keyof typeof motionEase;
export type MotionSpringToken = keyof typeof motionSpring;

export const motion = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: motionDuration.normal },
  },
  slideUp: {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 8 },
    transition: { duration: motionDuration.moderate, ease: motionEase.standard },
  },
  slideIn: {
    initial: { opacity: 0, x: -8 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -8 },
    transition: { duration: motionDuration.moderate, ease: motionEase.standard },
  },
  scale: {
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.97 },
    transition: { duration: motionDuration.normal },
  },
  listItem: {
    initial: { opacity: 0, y: 4 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: motionDuration.normal },
  },
} as const;
