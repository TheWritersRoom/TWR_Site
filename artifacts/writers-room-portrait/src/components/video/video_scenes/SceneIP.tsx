import { PortraitFeatureScene } from './PortraitFeatureScene';

export function SceneIP() {
  return (
    <PortraitFeatureScene
      imageSrc={`${import.meta.env.BASE_URL}images/01-ip-protection.jpg`}
      imageAlt="IP Protection"
      counter="01 / 06"
      titleLines={[
        { text: 'IP', color: '#F9F6EE', size: '13vh' },
        { text: 'Protection', color: '#E8B84B', size: '7vh' },
      ]}
      tagline="Your IP, ironclad."
      initial={{ clipPath: 'inset(0 100% 0 0)' }}
      animate={{ clipPath: 'inset(0 0% 0 0)' }}
      exit={{ opacity: 0, y: '-4vh', filter: 'blur(12px)' }}
      transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
    />
  );
}
