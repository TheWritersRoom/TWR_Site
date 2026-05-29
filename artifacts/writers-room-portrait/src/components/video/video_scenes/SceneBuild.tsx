import { PortraitFeatureScene } from './PortraitFeatureScene';

export function SceneBuild() {
  return (
    <PortraitFeatureScene
      imageSrc={`${import.meta.env.BASE_URL}images/07-features-overview.jpg`}
      imageAlt="Build your Writers Room"
      counter="01 / 07"
      titleLines={[
        { text: 'Build your', color: '#F9F6EE', size: '6.5vh' },
        { text: 'Writers', color: '#E8B84B', size: '10vh' },
        { text: 'Room', color: '#E8B84B', size: '10vh' },
      ]}
      tagline="One platform. Every stage of the journey."
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, y: '-4vh', filter: 'blur(12px)' }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
    />
  );
}
