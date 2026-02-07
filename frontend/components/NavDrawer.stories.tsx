import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import NavDrawer from './NavDrawer';
import { MobileUIProvider } from '@/context/MobileUIContext';

const meta = {
  title: 'Navigation/NavDrawer',
  component: NavDrawer,
  tags: ['autodocs'],
  parameters: {
    nextjs: { appDirectory: true, navigation: { pathname: '/artists' } },
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <MobileUIProvider>
        <Story />
      </MobileUIProvider>
    ),
  ],
} satisfies Meta<typeof NavDrawer>;

export default meta;
type Story = StoryObj<typeof meta>;

// NavDrawer reads isSidebarOpen from context and returns null when closed.
// Without a way to open it, it renders empty. We show it as documentation.
export const Default: Story = {};

// Render the nav items directly to show what the drawer looks like when open.
export const DrawerContents: Story = {
  render: () => (
    <aside
      className="w-72 bg-[#1c1a17] border-r border-[#2d2a26] flex flex-col"
      style={{ minHeight: 500 }}
    >
      <div className="flex items-center justify-between p-4 border-b border-[#2d2a26]">
        <span className="text-xl font-bold text-[#d4a060]">8pm.me</span>
        <button className="p-2 text-[#8a8478]" aria-label="Close menu">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {['Home', 'Search', 'Your Library', 'Venues', 'Recently Played'].map((label, i) => (
            <li key={label}>
              <span
                className={`flex items-center gap-4 px-4 py-3 rounded-lg ${
                  i === 0 ? 'bg-[#2d2a26] text-white' : 'text-[#8a8478]'
                }`}
              >
                <span className={`w-6 h-6 rounded ${i === 0 ? 'bg-[#d4a060]' : 'bg-[#3a3632]'}`} />
                <span className="font-medium">{label}</span>
              </span>
            </li>
          ))}
        </ul>
        <div className="my-4 mx-4 border-t border-[#2d2a26]" />
        <ul className="space-y-1 px-2">
          <li>
            <span className="flex items-center gap-4 px-4 py-3 rounded-lg text-[#8a8478]">
              <span className="w-6 h-6 rounded bg-[#3a3632]" />
              <span className="font-medium">Account</span>
            </span>
          </li>
        </ul>
      </nav>
      <div className="px-4 py-4 border-t border-[#2d2a26]">
        <p className="text-xs text-[#6a6458] text-center">Please copy freely - never sell</p>
      </div>
    </aside>
  ),
};
