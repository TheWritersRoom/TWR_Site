import { PortraitFeatureScene } from './PortraitFeatureScene';

export function ScenePlanner() {
  return (
    <PortraitFeatureScene
      imageSrc={`${import.meta.env.BASE_URL}images/02-structure-planner.jpg`}
      imageAlt="Structure Planner"
      counter="02 / 06"
      titleLines={[
        { text: 'Structure', color: '#F9F6EE', size: '8vh' },
        { text: 'Planner', color: '#E8B84B', size: '9.5vh' },
      ]}
      tagline="Plan the whole story."
      initial={{ clipPath: 'inset(100% 0 0 0)' }}
      animate={{ clipPath: 'inset(0% 0 0 0)' }}
      exit={{ opacity: 0, y: '-4vh', filter: 'blur(12px)' }}
      transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
    />
  );
}
