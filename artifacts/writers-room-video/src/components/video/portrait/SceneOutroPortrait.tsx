import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export function SceneOutroPortrait() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 100),
      setTimeout(() => setPhase(2), 900),
      setTimeout(() => setPhase(3), 1600),
      setTimeout(() => setPhase(4), 2500),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center"
      initial={{ clipPath: 'circle(0% at 50% 50%)' }}
      animate={{ clipPath: 'circle(150% at 50% 50%)' }}
      exit={{ opacity: 0, scale: 0.97, filter: 'blur(10px)' }}
      transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Features overview card */}
      <motion.div
        style={{
          borderRadius: '3vh',
          overflow: 'hidden',
          boxShadow:
            '0 30px 80px rgba(0,0,0,0.75), 0 0 0 1px rgba(232,184,75,0.25), 0 0 60px rgba(232,184,75,0.09)',
          marginBottom: '4vh',
          flexShrink: 0,
        }}
        initial={{ opacity: 0, y: '8vh', scale: 0.88 }}
        animate={phase >= 1 ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: '8vh', scale: 0.88 }}
        transition={{ type: 'spring', stiffness: 150, damping: 20 }}
      >
        <img
          src={`${import.meta.env.BASE_URL}images/07-features-overview.jpg`}
          alt="Everything you need"
          style={{
            display: 'block',
            width: '72vw',
            maxWidth: '72vh',
            height: 'auto',
            aspectRatio: '1 / 1',
            objectFit: 'cover',
          }}
        />
      </motion.div>

      {/* Divider */}
      <motion.div
        style={{ height: '1px', background: '#E8B84B', marginBottom: '3vh' }}
        initial={{ width: 0, opacity: 0 }}
        animate={phase >= 2 ? { width: '40%', opacity: 0.7 } : { width: 0, opacity: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      />

      {/* URL */}
      <motion.div
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: '1.8vh',
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: '#E8B84B',
          fontWeight: 500,
          marginBottom: '1.5vh',
          textAlign: 'center',
        }}
        initial={{ opacity: 0, filter: 'blur(10px)' }}
        animate={phase >= 3 ? { opacity: 1, filter: 'blur(0px)' } : { opacity: 0, filter: 'blur(10px)' }}
        transition={{ duration: 0.7, ease: 'circOut' }}
      >
        jointhewritersroom.com
      </motion.div>

      {/* Tagline */}
      <motion.div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '2.2vh',
          color: 'rgba(249,246,238,0.4)',
          fontStyle: 'italic',
          fontWeight: 700,
          textAlign: 'center',
        }}
        initial={{ opacity: 0 }}
        animate={phase >= 4 ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.6 }}
      >
        Pitch. Write. Edit. Publish. Together.
      </motion.div>
    </motion.div>
  );
}
