import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import AuthModal from './AuthModal';
import { MagentoAuthProvider } from '@/context/MagentoAuthContext';

const meta = {
  title: 'Modals/AuthModal',
  component: AuthModal,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <MagentoAuthProvider>
        <Story />
      </MagentoAuthProvider>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    onClose: fn(),
  },
} satisfies Meta<typeof AuthModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SignIn: Story = {
  args: {
    isOpen: true,
    initialMode: 'signin',
  },
};

export const SignUp: Story = {
  args: {
    isOpen: true,
    initialMode: 'signup',
  },
};

export const Closed: Story = {
  args: {
    isOpen: false,
  },
};
