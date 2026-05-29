import { PortraitFeatureScene } from './PortraitFeatureScene';

export function SceneSuggestions() {
  return (
    <PortraitFeatureScene
      imageSrc={`${import.meta.env.BASE_URL}images/04-suggestions.jpg`}
      imageAlt="Inline Suggestions"
      counter="04 / 07"
      titleLines={[
        { text: 'Inline', color: '#E8B84B', size: '11vh' },
        { text: 'Suggestions', color: '#F9F6EE', size: '6.5vh' },
      ]}
      tagline="Better writing, together."
      initial={{ clipPath: 'inset(50% 0 50% 0)' }}
      animate={{ clipPath: 'inset(0% 0 0% 0)' }}
      exit={{ opacity: 0, y: '-4vh', filter: 'blur(12px)' }}
      transition={{ duration: 0.75, ease: [0.4, 0, 0.2, 1] }}
    />
  );
}
