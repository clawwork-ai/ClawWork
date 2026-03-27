export const STAGGER_STEP = 0.03;

export const motionDuration = {
  fast: 0.1,
  normal: 0.15,
  moderate: 0.2,
  slow: 0.3,
  ambient: 0.5,
  dramatic: 0.35,
} as const;

export const motionEase = {
  standard: [0.2, 0, 0, 1],
  enter: [0, 0, 0.2, 1],
  exit: [0.4, 0, 1, 1],
  dramatic: [0.4, 0, 0, 1],
  gentle: [0.25, 0.1, 0.25, 1],
} as const;

export const motionSpring = {
  snappy: { type: 'spring' as const, bounce: 0.15, duration: 0.4 },
  gentle: { type: 'spring' as const, stiffness: 120, damping: 20, mass: 1 },
  bouncy: { type: 'spring' as const, stiffness: 300, damping: 18, mass: 0.8 },
  panelSettle: { type: 'spring' as const, stiffness: 200, damping: 28, mass: 1 },
} as const;

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
  staggerContainer: {
    animate: { transition: { staggerChildren: STAGGER_STEP } },
  },
  crossfade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: motionDuration.moderate, ease: motionEase.gentle },
  },
  dialogEnter: {
    initial: { opacity: 0, scale: 0.96, y: 8 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.96, y: 8 },
    transition: { duration: motionDuration.dramatic, ease: motionEase.dramatic },
  },
  cardHover: {
    whileHover: { y: -2, scale: 1.01 },
    transition: { duration: motionDuration.normal, ease: motionEase.standard },
  },
  messageEnter: {
    initial: { opacity: 0, y: 6 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: motionDuration.moderate, ease: motionEase.enter },
  },
  heroOverlay: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: motionDuration.ambient, ease: motionEase.gentle },
  },
  heroPanel: {
    initial: { opacity: 0, y: 16, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: 16, scale: 0.98 },
    transition: { ...motionSpring.panelSettle },
  },
  collapse: {
    initial: { opacity: 0, height: 0 },
    animate: { opacity: 1, height: 'auto' },
    exit: { opacity: 0, height: 0 },
    transition: { duration: motionDuration.normal },
  },
} as const;

export const commandPaletteMotion = {
  overlay: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: motionDuration.normal },
  },
  panel: {
    initial: { opacity: 0, scale: 0.96, y: -8 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.96, y: -8 },
    transition: { duration: motionDuration.moderate, ease: motionEase.dramatic },
  },
  item: {
    initial: { opacity: 0, x: -4 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: motionDuration.fast },
  },
} as const;

const reducedMotionQuery =
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : null;

export function safeMotion<T extends Record<string, unknown>>(preset: T): T | Record<string, never> {
  if (reducedMotionQuery?.matches) return {} as Record<string, never>;
  return preset;
}
