import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

const WORD = ['The', 'Writers', 'Room'];

export function SceneIntro() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 0),
      setTimeout(() => setPhase(2), 900),
      setTimeout(() => setPhase(3), 1900),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04, filter: 'blur(18px)' }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Ink drop SVG */}
      <motion.svg
        viewBox="0 0 100 120"
        className="mb-[2.5vh]"
        style={{ width: '5vw', height: '6vw' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: phase >= 1 ? 1 : 0 }}
        transition={{ duration: 0.4 }}
      >
        <motion.path
          d="M 50 110 Q 8 75 8 45 A 42 42 0 1 1 92 45 Q 92 75 50 110 Z"
          fill="none"
          stroke="#E8B84B"
          strokeWidth="2.5"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: phase >= 1 ? 1 : 0 }}
          transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1] }}
        />
        <motion.circle
          cx="50" cy="45" r="10"
          fill="#E8B84B"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: phase >= 1 ? 1 : 0, opacity: phase >= 1 ? 0.7 : 0 }}
          transition={{ delay: 0.7, duration: 0.4, ease: 'backOut' }}
          style={{ transformOrigin: '50px 45px' }}
        />
      </motion.svg>

      {/* Wordmark */}
      <div
        className="flex gap-[1.2vw] items-baseline mb-[1.5vh]"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {WORD.map((word, wi) => (
          <span key={wi} className="overflow-hidden flex">
            {word.split('').map((char, ci) => (
              <motion.span
                key={ci}
                style={{
                  display: 'inline-block',
                  fontSize: wi === 1 ? '8vw' : '5vw',
                  fontWeight: 900,
                  color: wi === 1 ? '#E8B84B' : '#F9F6EE',
                  lineHeight: 1,
                  letterSpacing: '-0.02em',
                }}
                initial={{ opacity: 0, y: '1.2em', rotateX: -40 }}
                animate={phase >= 2
                  ? { opacity: 1, y: 0, rotateX: 0 }
                  : { opacity: 0, y: '1.2em', rotateX: -40 }
                }
                transition={{
                  type: 'spring',
                  stiffness: 350,
                  damping: 26,
                  delay: phase >= 2 ? (wi * 0.12 + ci * 0.03) : 0,
                }}
              >
                {char}
              </motion.span>
            ))}
          </span>
        ))}
      </div>

      {/* Tagline */}
      <motion.p
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: '1.4vw',
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: '#7A6B5E',
          fontWeight: 400,
        }}
        initial={{ opacity: 0, filter: 'blur(12px)' }}
        animate={phase >= 3
          ? { opacity: 1, filter: 'blur(0px)' }
          : { opacity: 0, filter: 'blur(12px)' }
        }
        transition={{ duration: 0.7, ease: 'circOut' }}
      >
        Pitch. Write. Edit. Publish. Together.
      </motion.p>
    </motion.div>
  );
}
