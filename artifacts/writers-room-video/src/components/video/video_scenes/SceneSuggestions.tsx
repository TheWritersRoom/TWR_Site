import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export function SceneSuggestions() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 80),
      setTimeout(() => setPhase(2), 580),
      setTimeout(() => setPhase(3), 1060),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex items-center"
      initial={{ clipPath: 'inset(50% 0 50% 0)' }}
      animate={{ clipPath: 'inset(0% 0 0% 0)' }}
      exit={{ opacity: 0, x: '-4vw', filter: 'blur(12px)' }}
      transition={{ duration: 0.75, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Screenshot — left */}
      <div
        className="absolute left-[5vw] top-1/2"
        style={{ transform: 'translateY(-50%)', perspective: '900px' }}
      >
        <motion.div
          style={{
            width: '42vw',
            height: '42vw',
            borderRadius: '1.2vw',
            overflow: 'hidden',
            boxShadow: '0 30px 70px rgba(0,0,0,0.65), 0 0 0 1px rgba(232,184,75,0.18), 0 0 40px rgba(232,184,75,0.07)',
          }}
          initial={{ opacity: 0, rotateY: 14, scale: 0.91 }}
          animate={phase >= 1
            ? { opacity: 1, rotateY: 0, scale: 1 }
            : { opacity: 0, rotateY: 14, scale: 0.91 }
          }
          transition={{ type: 'spring', stiffness: 180, damping: 22 }}
        >
          <img
            src={`${import.meta.env.BASE_URL}images/04-suggestions.jpg`}
            alt="Inline Suggestions"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        </motion.div>
      </div>

      {/* Text — right */}
      <div className="absolute right-[6vw] top-1/2 -translate-y-1/2 text-right" style={{ maxWidth: '36vw' }}>
        <motion.div
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.85vw',
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            color: '#E8B84B',
            marginBottom: '1.2vh',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: phase >= 2 ? 0.9 : 0 }}
          transition={{ duration: 0.4 }}
        >
          04 / 06
        </motion.div>

        <div style={{ fontFamily: 'var(--font-display)', overflow: 'hidden' }}>
          {'Inline'.split('').map((ch, i) => (
            <motion.span
              key={`i-${i}`}
              style={{
                display: 'inline-block',
                fontSize: '5.5vw',
                fontWeight: 900,
                color: '#E8B84B',
                lineHeight: 1,
                letterSpacing: '-0.025em',
              }}
              initial={{ opacity: 0, y: '0.8em' }}
              animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: '0.8em' }}
              transition={{
                type: 'spring',
                stiffness: 320,
                damping: 24,
                delay: phase >= 2 ? i * 0.03 : 0,
              }}
            >
              {ch}
            </motion.span>
          ))}
          <br />
          {'Suggestions'.split('').map((ch, i) => (
            <motion.span
              key={`s-${i}`}
              style={{
                display: 'inline-block',
                fontSize: '5.5vw',
                fontWeight: 900,
                color: '#F9F6EE',
                lineHeight: 1.05,
                letterSpacing: '-0.025em',
              }}
              initial={{ opacity: 0, y: '0.8em' }}
              animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: '0.8em' }}
              transition={{
                type: 'spring',
                stiffness: 320,
                damping: 24,
                delay: phase >= 2 ? (6 + i) * 0.025 : 0,
              }}
            >
              {ch}
            </motion.span>
          ))}
        </div>

        <motion.p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '1.7vw',
            color: '#7A6B5E',
            marginTop: '1.5vh',
            fontStyle: 'italic',
            fontWeight: 300,
          }}
          initial={{ opacity: 0, filter: 'blur(8px)' }}
          animate={phase >= 3 ? { opacity: 1, filter: 'blur(0px)' } : { opacity: 0, filter: 'blur(8px)' }}
          transition={{ duration: 0.6, ease: 'circOut' }}
        >
          Better writing, together.
        </motion.p>
      </div>
    </motion.div>
  );
}
