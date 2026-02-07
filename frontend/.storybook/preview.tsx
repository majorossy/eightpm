import '../app/globals.css';
import type { Preview } from '@storybook/nextjs-vite';

const preview: Preview = {
  globalTypes: {
    mode: {
      description: 'Light/Dark mode for Campfire theme',
      toolbar: {
        title: 'Mode',
        icon: 'circlehollow',
        items: [
          { value: 'dark', title: 'Dark Mode', icon: 'moon' },
          { value: 'light', title: 'Light Mode', icon: 'sun' },
          { value: 'side-by-side', title: 'Side by Side', icon: 'sidebar' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    mode: 'dark',
  },
  decorators: [
    (Story, context) => {
      const mode = context.globals.mode;

      if (mode === 'side-by-side') {
        return (
          <div style={{ display: 'flex', minHeight: '100vh' }}>
            <div
              className="theme-campfire mode-dark"
              style={{ flex: 1, backgroundColor: '#1c1a17', padding: '2rem' }}
            >
              <div style={{ color: '#9a9488', fontSize: '0.75rem', marginBottom: '1rem', fontFamily: 'var(--font-space-mono)' }}>
                DARK MODE
              </div>
              <Story />
            </div>
            <div
              className="theme-campfire mode-light"
              style={{ flex: 1, backgroundColor: '#3d5a6e', padding: '2rem' }}
            >
              <div style={{ color: '#8aa4b5', fontSize: '0.75rem', marginBottom: '1rem', fontFamily: 'var(--font-space-mono)' }}>
                LIGHT MODE
              </div>
              <Story />
            </div>
          </div>
        );
      }

      const modeClass = mode === 'light' ? 'mode-light' : 'mode-dark';
      const bgColor = mode === 'light' ? '#3d5a6e' : '#1c1a17';

      return (
        <div className={`theme-campfire ${modeClass}`} style={{ backgroundColor: bgColor, minHeight: '100vh', padding: '2rem' }}>
          <Story />
        </div>
      );
    },
  ],
  parameters: {
    backgrounds: { disable: true },
    layout: 'fullscreen',
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      test: 'todo',
    },
  },
};
export default preview;
