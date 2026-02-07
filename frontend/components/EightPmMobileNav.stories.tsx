import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import EightPmMobileNav from './EightPmMobileNav';
import { AuthProvider } from '@/context/AuthContext';

const meta = {
  title: 'Navigation/EightPmMobileNav',
  component: EightPmMobileNav,
  tags: ['autodocs'],
  parameters: {
    nextjs: { appDirectory: true, navigation: { pathname: '/' } },
    layout: 'fullscreen',
    viewport: { defaultViewport: 'mobile1' },
  },
  decorators: [
    (Story) => (
      <AuthProvider>
        <div style={{ minHeight: 200, paddingBottom: 80, position: 'relative' }}>
          <Story />
        </div>
      </AuthProvider>
    ),
  ],
} satisfies Meta<typeof EightPmMobileNav>;

export default meta;
type Story = StoryObj<typeof meta>;

export const HomeActive: Story = {
  parameters: {
    nextjs: { appDirectory: true, navigation: { pathname: '/' } },
  },
};

export const SearchActive: Story = {
  parameters: {
    nextjs: { appDirectory: true, navigation: { pathname: '/search' } },
  },
};

export const LibraryActive: Story = {
  parameters: {
    nextjs: { appDirectory: true, navigation: { pathname: '/library' } },
  },
};
