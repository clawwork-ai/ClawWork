import { motion, useReducedMotion } from 'framer-motion';
import { motionDuration, motionEase } from '@/styles/design-tokens';
import MessageAvatar from './MessageAvatar';

export default function ThinkingIndicator() {
  const reduced = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: reduced ? 0 : 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: reduced ? 0 : 4 }}
      transition={{ duration: motionDuration.normal }}
      className="flex gap-3.5 py-4"
    >
      <MessageAvatar role="assistant" />
      <div className="flex items-center gap-1.5 py-2">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-2 h-2 rounded-full bg-[var(--text-muted)]"
            animate={reduced ? { opacity: [0.3, 1, 0.3] } : { opacity: [0.3, 1, 0.3], scale: [0.85, 1, 0.85] }}
            transition={{
              duration: motionDuration.slow * 4,
              repeat: Infinity,
              delay: i * motionDuration.moderate,
              ease: motionEase.standard,
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}
