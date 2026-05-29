import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export function SceneBuild() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 0),
      setTimeout(() => setPhase(2), 800),
      setTimeout(() => setPhase(3), 1700),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center"
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, y: '-3vh', filter: 'blur(14px)' }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* "Build your" */}
      <div style={{ fontFamily: 'var(--font-display)', overflow: 'hidden', lineHeight: 1, marginBottom: '0.4vh' }}>
        {'Build your'.split('').map((ch, i) => (
          <motion.span
            key={i}
            style={{
              display: 'inline-block',
              fontSize: '4.5vw',
              fontWeight: 900,
              color: '#F9F6EE',
              letterSpacing: '-0.02em',
              whiteSpace: ch === ' ' ? 'pre' : undefined,
            }}
            initial={{ opacity: 0, y: '1em' }}
            animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: '1em' }}
            transition={{ type: 'spring', stiffness: 320, damping: 26, delay: phase >= 1 ? i * 0.03 : 0 }}
          >
            {ch}
          </motion.span>
        ))}
      </div>

      {/* "Writers Room" */}
      <div style={{ fontFamily: 'var(--font-display)', overflow: 'hidden', lineHeight: 1, marginBottom: '4vh' }}>
        {'Writers Room'.split('').map((ch, i) => (
          <motion.span
            key={i}
            style={{
              display: 'inline-block',
              fontSize: '9vw',
              fontWeight: 900,
              color: '#E8B84B',
              letterSpacing: '-0.03em',
              whiteSpace: ch === ' ' ? 'pre' : undefined,
            }}
            initial={{ opacity: 0, y: '1em' }}
            animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: '1em' }}
            transition={{ type: 'spring', stiffness: 280, damping: 26, delay: phase >= 1 ? 0.15 + i * 0.03 : 0 }}
          >
            {ch}
          </motion.span>
        ))}
      </div>

      {/* Accent rule */}
      <motion.div
        style={{ height: '1px', background: '#E8B84B', marginBottom: '3vh' }}
        initial={{ width: 0, opacity: 0 }}
        animate={phase >= 2 ? { width: '22vw', opacity: 0.7 } : { width: 0, opacity: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      />

      {/* Supporting line */}
      <motion.p
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: '1.6vw',
          color: '#7A6B5E',
          fontStyle: 'italic',
          fontWeight: 300,
          textAlign: 'center',
          margin: 0,
        }}
        initial={{ opacity: 0, filter: 'blur(10px)' }}
        animate={phase >= 3 ? { opacity: 1, filter: 'blur(0px)' } : { opacity: 0, filter: 'blur(10px)' }}
        transition={{ duration: 0.7, ease: 'circOut' }}
      >
        One platform. Every stage of the journey.
      </motion.p>
    </motion.div>
  );
}
