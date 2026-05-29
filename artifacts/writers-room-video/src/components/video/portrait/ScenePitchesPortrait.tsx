import { PortraitFeatureScene } from './PortraitFeatureScene';

export function ScenePitchesPortrait() {
  return (
    <PortraitFeatureScene
      imageSrc={`${import.meta.env.BASE_URL}images/05-pitches-board.jpg`}
      imageAlt="Open Pitches"
      counter="05 / 06"
      titleLines={[
        { text: 'Open', color: '#F9F6EE', size: '12vh' },
        { text: 'Pitches', color: '#E8B84B', size: '10vh' },
      ]}
      tagline="Got an idea? Pitch it."
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, y: '-4vh', filter: 'blur(12px)' }}
      transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
    />
  );
}
