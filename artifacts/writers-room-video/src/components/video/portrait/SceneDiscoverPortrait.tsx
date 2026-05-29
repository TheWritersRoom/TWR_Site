import { PortraitFeatureScene } from './PortraitFeatureScene';

export function SceneDiscoverPortrait() {
  return (
    <PortraitFeatureScene
      imageSrc={`${import.meta.env.BASE_URL}images/06-discover.jpg`}
      imageAlt="Discover"
      counter="06 / 06"
      titleLines={[
        { text: 'Discover', color: '#F9F6EE', size: '10vh' },
      ]}
      tagline="Read what's being written."
      initial={{ clipPath: 'circle(0% at 50% 0%)' }}
      animate={{ clipPath: 'circle(150% at 50% 0%)' }}
      exit={{ opacity: 0, scale: 1.04, filter: 'blur(18px)' }}
      transition={{ duration: 0.85, ease: [0.4, 0, 0.2, 1] }}
    />
  );
}
