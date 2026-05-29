import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import { useVideoPlayer } from '@/lib/video';
import { SCENE_DURATIONS } from './VideoTemplate';
import { SceneIntroPortrait } from './portrait/SceneIntroPortrait';
import { SceneIPPortrait } from './portrait/SceneIPPortrait';
import { ScenePlannerPortrait } from './portrait/ScenePlannerPortrait';
import { SceneCollaboratorsPortrait } from './portrait/SceneCollaboratorsPortrait';
import { SceneSuggestionsPortrait } from './portrait/SceneSuggestionsPortrait';
import { ScenePitchesPortrait } from './portrait/ScenePitchesPortrait';
import { SceneDiscoverPortrait } from './portrait/SceneDiscoverPortrait';
import { SceneOutroPortrait } from './portrait/SceneOutroPortrait';

const PORTRAIT_SCENE_COMPONENTS: Record<string, React.ComponentType> = {
  intro:         SceneIntroPortrait,
  ip:            SceneIPPortrait,
  planner:       ScenePlannerPortrait,
  collaborators: SceneCollaboratorsPortrait,
  suggestions:   SceneSuggestionsPortrait,
  pitches:       ScenePitchesPortrait,
  discover:      SceneDiscoverPortrait,
  outro:         SceneOutroPortrait,
};

/* Persistent layer positions — % relative to the 9:16 inner container */
const BLOB1 = [
  { x: '50%', y: '35%', scale: 2.8 },
  { x: '75%', y: '22%', scale: 2.0 },
  { x: '25%', y: '68%', scale: 2.2 },
  { x: '70%', y: '42%', scale: 1.8 },
  { x: '30%', y: '28%', scale: 2.0 },
  { x: '76%', y: '65%', scale: 1.7 },
  { x: '24%', y: '55%', scale: 1.9 },
  { x: '50%', y: '38%', scale: 2.6 },
];

const BLOB2 = [
  { x: '50%', y: '72%', scale: 2.2 },
  { x: '22%', y: '70%', scale: 1.6 },
  { x: '76%', y: '30%', scale: 1.8 },
  { x: '25%', y: '28%', scale: 1.5 },
  { x: '72%', y: '60%', scale: 1.7 },
  { x: '22%', y: '28%', scale: 1.4 },
  { x: '76%', y: '42%', scale: 1.6 },
  { x: '50%', y: '72%', scale: 2.0 },
];

export default function PortraitVideoTemplate({
  durations = SCENE_DURATIONS,
  loop = true,
  muted = false,
  onSceneChange,
}: {
  durations?: Record<string, number>;
  loop?: boolean;
  muted?: boolean;
  onSceneChange?: (sceneKey: string) => void;
} = {}) {
  const { currentSceneKey } = useVideoPlayer({ durations, loop });

  useEffect(() => {
    onSceneChange?.(currentSceneKey);
  }, [currentSceneKey, onSceneChange]);

  const baseSceneKey = currentSceneKey.replace(/_r[12]$/, '') as keyof typeof SCENE_DURATIONS;
  const sceneIndex = Math.max(0, Object.keys(SCENE_DURATIONS).indexOf(baseSceneKey));
  const SceneComponent = PORTRAIT_SCENE_COMPONENTS[baseSceneKey];

  const b1 = BLOB1[sceneIndex] ?? BLOB1[0];
  const b2 = BLOB2[sceneIndex] ?? BLOB2[0];

  return (
    /* Fill 100% of whatever container VideoWithControls gives us */
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: '#1A1614' }}>

      {/* ── Persistent background ── */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {/* Noise texture */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
            opacity: 0.025,
          }}
        />

        {/* Blob 1 */}
        <motion.div
          style={{
            position: 'absolute',
            width: '120%',
            height: '60%',
            background: 'radial-gradient(circle, rgba(232,184,75,0.22) 0%, transparent 70%)',
            filter: 'blur(50px)',
            translateX: '-50%',
            translateY: '-50%',
          }}
          animate={{ left: b1.x, top: b1.y, scale: b1.scale }}
          transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
        />

        {/* Blob 2 */}
        <motion.div
          style={{
            position: 'absolute',
            width: '90%',
            height: '45%',
            background: 'radial-gradient(circle, rgba(232,184,75,0.12) 0%, transparent 70%)',
            filter: 'blur(40px)',
            translateX: '-50%',
            translateY: '-50%',
          }}
          animate={{ left: b2.x, top: b2.y, scale: b2.scale }}
          transition={{ duration: 2.0, ease: [0.16, 1, 0.3, 1] }}
        />

        {/* Drifting ambient */}
        <motion.div
          style={{
            position: 'absolute',
            width: '80%',
            height: '40%',
            background: 'radial-gradient(circle, rgba(122,107,94,0.08) 0%, transparent 70%)',
            filter: 'blur(30px)',
          }}
          animate={{
            x: ['-10%', '20%', '5%', '-10%'],
            y: ['10%', '55%', '75%', '10%'],
          }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* ── Persistent accent: bottom horizontal rule ── */}
      <motion.div
        style={{
          position: 'absolute',
          bottom: '8%',
          height: '1px',
          background: '#E8B84B',
          left: '50%',
          translateX: '-50%',
        }}
        animate={{
          width: sceneIndex === 0 || sceneIndex === 7 ? '35%' : '28%',
          opacity: sceneIndex === 0 ? 0 : 0.4,
        }}
        transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
      />

      {/* ── Scene content ── */}
      <AnimatePresence mode="popLayout">
        {SceneComponent && <SceneComponent key={currentSceneKey} />}
      </AnimatePresence>

      {/* ── Audio ── */}
      <audio
        key={String(muted)}
        src={`${import.meta.env.BASE_URL}audio/bg_music.mp3`}
        preload="auto"
        autoPlay
        loop
        muted={muted}
        style={{ display: 'none' }}
        onError={() => { /* graceful no-op if file missing */ }}
      />
    </div>
  );
}
