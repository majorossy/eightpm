import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import InstallPrompt from './InstallPrompt';

const meta = {
  title: 'Primitives/InstallPrompt',
  component: InstallPrompt,
  tags: ['autodocs'],
} satisfies Meta<typeof InstallPrompt>;

export default meta;
type Story = StoryObj<typeof meta>;

// InstallPrompt uses usePWAInstall() which returns isInstallable=false in non-PWA contexts.
// It will render null in Storybook since the browser install prompt isn't available.
export const Default: Story = {};

// Static representation of the banner for visual reference
export const BannerPreview: Story = {
  render: () => (
    <div style={{ position: 'relative', minHeight: 300 }}>
      <div style={{
        position: 'absolute',
        bottom: 100,
        left: 16,
        right: 16,
        maxWidth: 320,
        background: '#2d2a26',
        border: '1px solid #3a3632',
        borderRadius: 8,
        overflow: 'hidden',
        boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
      }}>
        <div style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{
              width: 40, height: 40, background: '#d4a060', borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0,
            }}>
              &#9889;
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ color: '#e8e0d4', fontSize: 14, fontWeight: 500, margin: 0 }}>Install 8pm.me</h3>
              <p style={{ color: '#8a8478', fontSize: 12, margin: '2px 0 0' }}>
                Add to your home screen for the best experience
              </p>
            </div>
          </div>
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <button style={{
              flex: 1, padding: '8px 0', background: '#d4a060', color: '#1c1a17',
              fontSize: 14, fontWeight: 500, border: 'none', borderRadius: 6, cursor: 'pointer',
            }}>
              Install
            </button>
            <button style={{
              padding: '8px 16px', background: 'transparent', color: '#8a8478',
              fontSize: 14, border: 'none', cursor: 'pointer',
            }}>
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  ),
};

export const IOSInstructionsPreview: Story = {
  render: () => (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: 400,
    }}>
      <div style={{
        background: '#1c1a17', border: '1px solid #3a3632', borderRadius: 8,
        width: '100%', maxWidth: 384, padding: 24, boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <span style={{ fontSize: 30 }}>&#9889;</span>
          <h2 style={{ color: '#e8e0d4', fontSize: 18, fontFamily: 'serif', marginTop: 8 }}>
            Install on iOS
          </h2>
        </div>
        <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {['Tap the Share button in Safari', 'Scroll down and tap "Add to Home Screen"', 'Tap "Add" in the top right corner'].map((step, i) => (
            <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, color: '#e8e0d4', fontSize: 14 }}>
              <span style={{
                width: 24, height: 24, background: '#d4a060', color: '#1c1a17', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 500, flexShrink: 0,
              }}>
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
        <button style={{
          width: '100%', marginTop: 24, padding: '12px 0', background: '#d4a060',
          color: '#1c1a17', fontWeight: 500, border: 'none', borderRadius: 6, cursor: 'pointer',
        }}>
          Got it
        </button>
      </div>
    </div>
  ),
};
