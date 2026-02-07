import type { Meta, StoryObj } from '@storybook/nextjs-vite';

// Breadcrumb component has deep provider dependencies (BreadcrumbContext + PlayerContext →
// QueueContext → RecentlyPlayedContext → QualityContext). Instead of mounting the full
// provider tree, we render static previews that demonstrate the visual output.

const meta = {
  title: 'Navigation/Breadcrumb',
  tags: ['autodocs'],
  parameters: {
    nextjs: { appDirectory: true, navigation: { pathname: '/' } },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// Static preview showing what breadcrumbs look like
export const BreadcrumbPreview: Story = {
  render: () => (
    <nav aria-label="Breadcrumb" className="flex items-center text-sm" style={{ padding: '0.5rem 0' }}>
      <span style={{ color: 'var(--text-dim)', marginRight: 8, fontSize: 20 }}>&#9776;</span>
      <svg className="w-4 h-4 shrink-0 mx-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--text-subdued, #6a6458)' }}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
      <span style={{ color: 'var(--text-dim, #8a8478)' }}>8pm.me</span>
      <svg className="w-4 h-4 shrink-0 mx-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--text-subdued, #6a6458)' }}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
      <span style={{ color: 'var(--text-subdued, #6a6458)' }}>Artist: </span>
      <span style={{ color: 'var(--text, #e8e0d4)', fontWeight: 500 }}>Railroad Earth</span>
    </nav>
  ),
};

export const DeepBreadcrumbPreview: Story = {
  render: () => (
    <nav aria-label="Breadcrumb" className="flex items-center text-sm" style={{ padding: '0.5rem 0' }}>
      <span style={{ color: 'var(--text-dim)', marginRight: 8, fontSize: 20 }}>&#9776;</span>
      <svg className="w-4 h-4 shrink-0 mx-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--text-subdued, #6a6458)' }}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
      <span style={{ color: 'var(--text-dim, #8a8478)' }}>8pm.me</span>
      {[
        { prefix: 'Artist: ', label: 'Railroad Earth', dim: true },
        { prefix: 'Album: ', label: 'Live at Red Rocks 2024-01-01', dim: true },
        { prefix: 'Track: ', label: 'Bird in a House', dim: false },
      ].map((crumb, i) => (
        <span key={i} className="flex items-center">
          <svg className="w-4 h-4 shrink-0 mx-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--text-subdued, #6a6458)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span style={{ color: 'var(--text-subdued, #6a6458)' }}>{crumb.prefix}</span>
          <span style={{ color: crumb.dim ? 'var(--text-dim, #8a8478)' : 'var(--text, #e8e0d4)', fontWeight: crumb.dim ? 400 : 500 }}>
            {crumb.label}
          </span>
        </span>
      ))}
    </nav>
  ),
};
