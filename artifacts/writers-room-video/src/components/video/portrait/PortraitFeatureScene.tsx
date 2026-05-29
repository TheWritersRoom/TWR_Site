import { motion } from 'framer-motion';
import { useState, useEffect, ComponentProps } from 'react';

interface TitleLine {
  text: string;
  color?: string;
  size?: string;
}

export interface PortraitFeatureSceneProps
  extends Pick<ComponentProps<typeof motion.div>, 'initial' | 'animate' | 'exit' | 'transition'> {
  imageSrc: string;
  imageAlt: string;
  counter: string;
  titleLines: TitleLine[];
  tagline: string;
  imageTopPad?: string;
}

export function PortraitFeatureScene({
  imageSrc,
  imageAlt,
  counter,
  titleLines,
  tagline,
  imageTopPad = '6vh',
  initial,
  animate,
  exit,
  transition,
}: PortraitFeatureSceneProps) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 80),
      setTimeout(() => setPhase(2), 600),
      setTimeout(() => setPhase(3), 1060),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center"
      style={{ paddingTop: imageTopPad }}
      initial={initial}
      animate={animate}
      exit={exit}
      transition={transition}
    >
      {/* Screenshot card */}
      <motion.div
        style={{
          width: '86%',
          aspectRatio: '1 / 1',
          borderRadius: '3vh',
          overflow: 'hidden',
          flexShrink: 0,
          boxShadow:
            '0 20px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(232,184,75,0.22), 0 0 40px rgba(232,184,75,0.08)',
          marginBottom: '3.5vh',
        }}
        initial={{ opacity: 0, y: '8vh', scale: 0.91 }}
        animate={phase >= 1 ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: '8vh', scale: 0.91 }}
        transition={{ type: 'spring', stiffness: 160, damping: 20 }}
      >
        <img
          src={imageSrc}
          alt={imageAlt}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      </motion.div>

      {/* Counter */}
      <motion.div
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: '1.55vh',
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          color: '#E8B84B',
          marginBottom: '1.2vh',
          fontWeight: 500,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: phase >= 2 ? 0.9 : 0 }}
        transition={{ duration: 0.4 }}
      >
        {counter}
      </motion.div>

      {/* Title lines — per-char stagger */}
      {titleLines.map((line, li) => (
        <div key={li} style={{ fontFamily: 'var(--font-display)', overflow: 'hidden', lineHeight: 1.05 }}>
          {line.text.split('').map((ch, ci) => (
            <motion.span
              key={ci}
              style={{
                display: 'inline-block',
                fontSize: line.size ?? '7.5vh',
                fontWeight: 900,
                color: line.color ?? '#F9F6EE',
                letterSpacing: '-0.025em',
                whiteSpace: ch === ' ' ? 'pre' : undefined,
              }}
              initial={{ opacity: 0, y: '0.8em' }}
              animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: '0.8em' }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 24,
                delay: phase >= 2 ? (li * 10 + ci) * 0.022 : 0,
              }}
            >
              {ch}
            </motion.span>
          ))}
        </div>
      ))}

      {/* Accent rule */}
      <motion.div
        style={{ height: '1px', background: '#E8B84B', marginTop: '2vh', marginBottom: '2vh' }}
        initial={{ width: 0, opacity: 0 }}
        animate={phase >= 2 ? { width: '32%', opacity: 0.75 } : { width: 0, opacity: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.35 }}
      />

      {/* Tagline */}
      <motion.p
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: '2.2vh',
          color: '#7A6B5E',
          fontStyle: 'italic',
          fontWeight: 300,
          textAlign: 'center',
          margin: 0,
        }}
        initial={{ opacity: 0, filter: 'blur(8px)' }}
        animate={phase >= 3 ? { opacity: 1, filter: 'blur(0px)' } : { opacity: 0, filter: 'blur(8px)' }}
        transition={{ duration: 0.6, ease: 'circOut' }}
      >
        {tagline}
      </motion.p>
    </motion.div>
  );
}
