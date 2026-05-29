import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export function SceneIntroPortrait() {
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
        style={{ width: '12vh', height: '14.4vh', marginBottom: '4vh' }}
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

      {/* "The" */}
      <div
        style={{
          fontFamily: 'var(--font-display)',
          overflow: 'hidden',
          lineHeight: 1,
          marginBottom: '0.5vh',
        }}
      >
        {'The'.split('').map((ch, i) => (
          <motion.span
            key={i}
            style={{
              display: 'inline-block',
              fontSize: '6vh',
              fontWeight: 900,
              color: '#F9F6EE',
              letterSpacing: '-0.02em',
            }}
            initial={{ opacity: 0, y: '1em', rotateX: -40 }}
            animate={phase >= 2 ? { opacity: 1, y: 0, rotateX: 0 } : { opacity: 0, y: '1em', rotateX: -40 }}
            transition={{
              type: 'spring',
              stiffness: 350,
              damping: 26,
              delay: phase >= 2 ? i * 0.04 : 0,
            }}
          >
            {ch}
          </motion.span>
        ))}
      </div>

      {/* "Writers" */}
      <div style={{ fontFamily: 'var(--font-display)', overflow: 'hidden', lineHeight: 1, marginBottom: '0.5vh' }}>
        {'Writers'.split('').map((ch, i) => (
          <motion.span
            key={i}
            style={{
              display: 'inline-block',
              fontSize: '12vh',
              fontWeight: 900,
              color: '#E8B84B',
              letterSpacing: '-0.03em',
            }}
            initial={{ opacity: 0, y: '1em', rotateX: -40 }}
            animate={phase >= 2 ? { opacity: 1, y: 0, rotateX: 0 } : { opacity: 0, y: '1em', rotateX: -40 }}
            transition={{
              type: 'spring',
              stiffness: 350,
              damping: 26,
              delay: phase >= 2 ? (3 + i) * 0.04 : 0,
            }}
          >
            {ch}
          </motion.span>
        ))}
      </div>

      {/* "Room" */}
      <div style={{ fontFamily: 'var(--font-display)', overflow: 'hidden', lineHeight: 1, marginBottom: '4vh' }}>
        {'Room'.split('').map((ch, i) => (
          <motion.span
            key={i}
            style={{
              display: 'inline-block',
              fontSize: '12vh',
              fontWeight: 900,
              color: '#F9F6EE',
              letterSpacing: '-0.03em',
            }}
            initial={{ opacity: 0, y: '1em', rotateX: -40 }}
            animate={phase >= 2 ? { opacity: 1, y: 0, rotateX: 0 } : { opacity: 0, y: '1em', rotateX: -40 }}
            transition={{
              type: 'spring',
              stiffness: 350,
              damping: 26,
              delay: phase >= 2 ? (10 + i) * 0.04 : 0,
            }}
          >
            {ch}
          </motion.span>
        ))}
      </div>

      {/* Tagline */}
      <motion.p
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: '2vh',
          letterSpacing: '0.28em',
          textTransform: 'uppercase',
          color: '#7A6B5E',
          fontWeight: 400,
          margin: 0,
          textAlign: 'center',
        }}
        initial={{ opacity: 0, filter: 'blur(12px)' }}
        animate={phase >= 3 ? { opacity: 1, filter: 'blur(0px)' } : { opacity: 0, filter: 'blur(12px)' }}
        transition={{ duration: 0.7, ease: 'circOut' }}
      >
        Write. Protect. Collaborate.
      </motion.p>
    </motion.div>
  );
}
