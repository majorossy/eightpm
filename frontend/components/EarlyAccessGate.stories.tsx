import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import EarlyAccessGate from './EarlyAccessGate';

const meta = {
  title: 'Primitives/EarlyAccessGate',
  component: EarlyAccessGate,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof EarlyAccessGate>;

export default meta;
type Story = StoryObj<typeof meta>;

// EarlyAccessGate checks localStorage. If '8pm-early-access' is 'true',
// it renders children; otherwise it shows the login form.
export const Default: Story = {
  args: {
    children: (
      <div style={{ padding: '2rem', color: 'var(--text)' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>App Content</h1>
        <p>This content is behind the early access gate.</p>
      </div>
    ),
  },
};

// Static preview of the login form (no localStorage dependency)
export const LoginFormPreview: Story = {
  render: () => (
    <div style={{
      position: 'fixed', inset: 0, background: '#1c1a17',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div style={{
        background: '#252220', borderRadius: 12, padding: 32, maxWidth: 448,
        width: '100%', boxShadow: '0 4px 24px rgba(0,0,0,0.5)', border: '1px solid #3a3632',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#d4a060', fontFamily: 'Georgia, serif', marginBottom: 8 }}>
            8pm.me
          </h1>
          <div style={{
            display: 'inline-block', padding: '4px 12px',
            background: 'rgba(212, 160, 96, 0.1)', borderRadius: 9999,
          }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: '#d4a060', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Early Access
            </span>
          </div>
        </div>
        <p style={{ color: '#a8a098', textAlign: 'center', marginBottom: 24, fontSize: 14 }}>
          This site is still under development.<br />
          Enter your credentials to continue.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#8a8478', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Username
            </label>
            <input
              type="text"
              placeholder="Enter username"
              readOnly
              style={{
                width: '100%', padding: '12px 16px', background: '#1c1a17', border: '1px solid #3a3632',
                borderRadius: 8, color: '#e8e0d4', fontSize: 14, boxSizing: 'border-box',
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#8a8478', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Password
            </label>
            <input
              type="password"
              placeholder="Enter password"
              readOnly
              style={{
                width: '100%', padding: '12px 16px', background: '#1c1a17', border: '1px solid #3a3632',
                borderRadius: 8, color: '#e8e0d4', fontSize: 14, boxSizing: 'border-box',
              }}
            />
          </div>
          <button style={{
            width: '100%', padding: 12, background: '#d4a060', color: '#1c1a17',
            fontWeight: 'bold', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14,
          }}>
            Enter
          </button>
        </div>
        <p style={{ color: '#6a6458', fontSize: 12, textAlign: 'center', marginTop: 24 }}>
          Live music archive - Coming soon
        </p>
      </div>
    </div>
  ),
};
