import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import { useVideoPlayer } from '@/lib/video';
import { SceneIntro } from './video_scenes/SceneIntro';
import { SceneBuild } from './video_scenes/SceneBuild';
import { ScenePlanner } from './video_scenes/ScenePlanner';
import { SceneCollaborators } from './video_scenes/SceneCollaborators';
import { SceneSuggestions } from './video_scenes/SceneSuggestions';
import { SceneIP } from './video_scenes/SceneIP';
import { ScenePitches } from './video_scenes/ScenePitches';
import { SceneDiscover } from './video_scenes/SceneDiscover';
import { SceneOutro } from './video_scenes/SceneOutro';

export const SCENE_DURATIONS: Record<string, number> = {
  intro:         4000,
  build:         3500,
  planner:       3500,
  collaborators: 3500,
  suggestions:   3500,
  ip:            3500,
  pitches:       3500,
  discover:      3000,
  outro:         5000,
};

const SCENE_COMPONENTS: Record<string, React.ComponentType> = {
  intro:         SceneIntro,
  build:         SceneBuild,
  planner:       ScenePlanner,
  collaborators: SceneCollaborators,
  suggestions:   SceneSuggestions,
  ip:            SceneIP,
  pitches:       ScenePitches,
  discover:      SceneDiscover,
  outro:         SceneOutro,
};

/* Persistent layer data keyed by scene index (0=intro…8=outro) */
const BLOB1 = [
  { x: '50%', y: '40%', scale: 3.2 }, // intro
  { x: '50%', y: '50%', scale: 2.6 }, // build
  { x: '18%', y: '78%', scale: 2.2 }, // planner
  { x: '74%', y: '48%', scale: 1.8 }, // collaborators
  { x: '26%', y: '36%', scale: 2.0 }, // suggestions
  { x: '80%', y: '22%', scale: 2.0 }, // ip
  { x: '82%', y: '72%', scale: 1.7 }, // pitches
  { x: '22%', y: '58%', scale: 1.9 }, // discover
  { x: '50%', y: '40%', scale: 2.8 }, // outro
];

const BLOB2 = [
  { x: '50%', y: '70%', scale: 2.4 }, // intro
  { x: '50%', y: '30%', scale: 2.0 }, // build
  { x: '80%', y: '28%', scale: 1.8 }, // planner
  { x: '22%', y: '30%', scale: 1.5 }, // collaborators
  { x: '76%', y: '62%', scale: 1.7 }, // suggestions
  { x: '18%', y: '72%', scale: 1.6 }, // ip
  { x: '20%', y: '30%', scale: 1.4 }, // pitches
  { x: '78%', y: '44%', scale: 1.6 }, // discover
  { x: '50%', y: '70%', scale: 2.2 }, // outro
];

const LINE_LEFT    = ['50%',  '50%',  '52vw', '6vw',  '52vw', '6vw',  '6vw',  '52vw', '30vw'];
const LINE_WIDTH   = ['0px',  '0px',  '22vw', '24vw', '22vw', '24vw', '24vw', '22vw', '40vw'];
const LINE_OPACITY = [0,       0,      0.8,    0.8,    0.8,    0.8,    0.8,    0.8,    0.5];

const FLOAT_X = ['48vw', '50vw', '88vw', '10vw', '86vw', '8vw',  '10vw', '88vw', '48vw'];
const FLOAT_Y = ['14vh', '14vh', '18vh', '20vh', '74vh', '72vh', '22vh', '70vh', '14vh'];
const FLOAT_R = [0,       10,     90,     135,    180,    45,     225,    270,    360];

const SCENE_START_SEC: Record<string, number> = (() => {
  const out: Record<string, number> = {};
  let ms = 0;
  for (const [k, v] of Object.entries(SCENE_DURATIONS)) {
    out[k] = ms / 1000;
    ms += v;
  }
  return out;
})();

export default function VideoTemplate({
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
  const SceneComponent = SCENE_COMPONENTS[baseSceneKey];

  const b1 = BLOB1[sceneIndex] ?? BLOB1[0];
  const b2 = BLOB2[sceneIndex] ?? BLOB2[0];

  return (
    <div className="relative w-full h-screen overflow-hidden" style={{ background: '#1A1614' }}>

      {/* ── Persistent background ── */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
            opacity: 0.025,
          }}
        />

        <motion.div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: '55vw', height: '55vw',
            background: 'radial-gradient(circle, rgba(232,184,75,0.22) 0%, transparent 70%)',
            filter: 'blur(50px)', translateX: '-50%', translateY: '-50%',
          }}
          animate={{ left: b1.x, top: b1.y, scale: b1.scale }}
          transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
        />

        <motion.div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: '40vw', height: '40vw',
            background: 'radial-gradient(circle, rgba(232,184,75,0.12) 0%, transparent 70%)',
            filter: 'blur(40px)', translateX: '-50%', translateY: '-50%',
          }}
          animate={{ left: b2.x, top: b2.y, scale: b2.scale }}
          transition={{ duration: 2.0, ease: [0.16, 1, 0.3, 1] }}
        />

        <motion.div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: '30vw', height: '30vw',
            background: 'radial-gradient(circle, rgba(122,107,94,0.08) 0%, transparent 70%)',
            filter: 'blur(30px)',
          }}
          animate={{ x: ['-5vw', '15vw', '5vw', '-5vw'], y: ['10vh', '60vh', '80vh', '10vh'] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* ── Persistent midground ── */}
      <motion.div
        className="absolute pointer-events-none"
        style={{ top: '62%', height: '1px', background: '#E8B84B' }}
        animate={{
          left: LINE_LEFT[sceneIndex],
          width: LINE_WIDTH[sceneIndex],
          opacity: LINE_OPACITY[sceneIndex],
        }}
        transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
      />

      <motion.div
        className="absolute pointer-events-none"
        style={{ width: '2vw', height: '2vw', border: '1px solid rgba(232,184,75,0.35)', borderRadius: '2px' }}
        animate={{
          left: FLOAT_X[sceneIndex],
          top: FLOAT_Y[sceneIndex],
          rotate: FLOAT_R[sceneIndex],
          opacity: (sceneIndex === 0 || sceneIndex === 1 || sceneIndex === 8) ? 0 : 0.7,
        }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
      />

      <motion.div
        className="absolute pointer-events-none"
        style={{ width: '1.2vw', height: '1.2vw', border: '1px solid rgba(249,246,238,0.12)', borderRadius: '50%' }}
        animate={{
          left: FLOAT_Y[sceneIndex],
          top: FLOAT_X[(sceneIndex + 4) % 9],
          opacity: (sceneIndex === 8) ? 0 : 0.5,
          scale: [1, 1.3, 1],
        }}
        transition={{
          left: { duration: 1.4, ease: [0.16, 1, 0.3, 1] },
          top: { duration: 1.4, ease: [0.16, 1, 0.3, 1] },
          opacity: { duration: 0.6 },
          scale: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
        }}
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
