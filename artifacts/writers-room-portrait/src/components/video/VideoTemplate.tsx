import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { useVideoPlayer } from '@/lib/video';
import { SceneIntro } from './video_scenes/SceneIntro';
import { SceneIP } from './video_scenes/SceneIP';
import { ScenePlanner } from './video_scenes/ScenePlanner';
import { SceneCollaborators } from './video_scenes/SceneCollaborators';
import { SceneSuggestions } from './video_scenes/SceneSuggestions';
import { ScenePitches } from './video_scenes/ScenePitches';
import { SceneDiscover } from './video_scenes/SceneDiscover';
import { SceneOutro } from './video_scenes/SceneOutro';

export const SCENE_DURATIONS: Record<string, number> = {
  intro:         4000,
  ip:            3500,
  planner:       3500,
  collaborators: 3500,
  suggestions:   3500,
  pitches:       3500,
  discover:      3000,
  outro:         5000,
};

const SCENE_COMPONENTS: Record<string, React.ComponentType> = {
  intro:         SceneIntro,
  ip:            SceneIP,
  planner:       ScenePlanner,
  collaborators: SceneCollaborators,
  suggestions:   SceneSuggestions,
  pitches:       ScenePitches,
  discover:      SceneDiscover,
  outro:         SceneOutro,
};

const BLOB1_POS = [
  { x: '75%', y: '18%', scale: 1.6 },
  { x: '68%', y: '22%', scale: 1.4 },
  { x: '20%', y: '28%', scale: 1.5 },
  { x: '72%', y: '60%', scale: 1.35 },
  { x: '30%', y: '20%', scale: 1.6 },
  { x: '65%', y: '30%', scale: 1.45 },
  { x: '22%', y: '55%', scale: 1.55 },
  { x: '50%', y: '35%', scale: 1.7 },
];

const BLOB2_POS = [
  { x: '20%', y: '80%', scale: 1.3 },
  { x: '30%', y: '70%', scale: 1.2 },
  { x: '75%', y: '68%', scale: 1.25 },
  { x: '25%', y: '30%', scale: 1.1 },
  { x: '72%', y: '75%', scale: 1.3 },
  { x: '25%', y: '65%', scale: 1.2 },
  { x: '70%', y: '22%', scale: 1.25 },
  { x: '20%', y: '72%', scale: 1.4 },
];

const AUDIO_SEEK_EPSILON_SEC = 0.18;

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

  const baseSceneKey = currentSceneKey.replace(/_r[12]$/, '');
  const sceneIndex = Math.max(0, Object.keys(SCENE_DURATIONS).indexOf(baseSceneKey));
  const SceneComponent = SCENE_COMPONENTS[baseSceneKey];

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0.45;
    const targetTime = SCENE_START_SEC[baseSceneKey] ?? 0;
    if (Math.abs(audio.currentTime - targetTime) > AUDIO_SEEK_EPSILON_SEC) {
      audio.currentTime = targetTime;
    }
    audio.play().catch(() => {});
  }, [currentSceneKey, baseSceneKey, muted]);

  const b1 = BLOB1_POS[sceneIndex] ?? BLOB1_POS[0];
  const b2 = BLOB2_POS[sceneIndex] ?? BLOB2_POS[0];

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: '#1A1614' }}>

      {/* Persistent background */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {/* Noise texture */}
        <div
          style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
            backgroundSize: '180px 180px', opacity: 0.025,
          }}
        />

        {/* Golden blob 1 */}
        <motion.div
          style={{
            position: 'absolute', width: '70%', aspectRatio: '1', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(232,184,75,0.22) 0%, rgba(232,184,75,0.06) 55%, transparent 75%)',
            translateX: '-50%', translateY: '-50%', filter: 'blur(28px)',
          }}
          animate={{ left: b1.x, top: b1.y, scale: b1.scale }}
          transition={{ duration: 2.4, ease: [0.4, 0, 0.2, 1] }}
        />

        {/* Cream blob 2 */}
        <motion.div
          style={{
            position: 'absolute', width: '55%', aspectRatio: '1', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(249,246,238,0.07) 0%, rgba(249,246,238,0.02) 60%, transparent 80%)',
            translateX: '-50%', translateY: '-50%', filter: 'blur(36px)',
          }}
          animate={{ left: b2.x, top: b2.y, scale: b2.scale }}
          transition={{ duration: 3.0, ease: [0.4, 0, 0.2, 1] }}
        />

        {/* Ambient glow */}
        <motion.div
          style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse 70% 40% at 50% 85%, rgba(232,184,75,0.05) 0%, transparent 70%)',
          }}
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Bottom accent rule */}
      <motion.div
        style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px',
          background: 'linear-gradient(90deg, transparent, #E8B84B, transparent)',
          opacity: 0.45,
        }}
        animate={{ scaleX: [0.7, 1, 0.7] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Scenes */}
      <AnimatePresence mode="popLayout">
        {SceneComponent && <SceneComponent key={currentSceneKey} />}
      </AnimatePresence>

      {/* Background music */}
      <audio
        ref={audioRef}
        src={`${import.meta.env.BASE_URL}audio/bg_music.mp3`}
        preload="auto"
        autoPlay
        muted={muted}
        onError={() => {}}
      />
    </div>
  );
}
