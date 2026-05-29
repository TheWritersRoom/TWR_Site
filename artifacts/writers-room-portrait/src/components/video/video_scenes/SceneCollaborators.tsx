import { PortraitFeatureScene } from './PortraitFeatureScene';

export function SceneCollaborators() {
  return (
    <PortraitFeatureScene
      imageSrc={`${import.meta.env.BASE_URL}images/03-collaborators.jpg`}
      imageAlt="Collaborators"
      counter="03 / 06"
      titleLines={[
        { text: 'Collaborators', color: '#F9F6EE', size: '5.8vh' },
      ]}
      tagline="Build your writing team."
      initial={{ clipPath: 'circle(0% at 50% 100%)' }}
      animate={{ clipPath: 'circle(150% at 50% 100%)' }}
      exit={{ opacity: 0, scale: 1.03, filter: 'blur(14px)' }}
      transition={{ duration: 0.85, ease: [0.4, 0, 0.2, 1] }}
    />
  );
}
