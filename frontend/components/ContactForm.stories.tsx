import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ContactForm } from './ContactForm';
import { ToastProvider } from './ToastContainer';

const meta = {
  title: 'Forms/ContactForm',
  component: ContactForm,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <ToastProvider>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <Story />
        </div>
      </ToastProvider>
    ),
  ],
} satisfies Meta<typeof ContactForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const InCard: Story = {
  decorators: [
    (Story) => (
      <div style={{
        background: '#252220',
        borderRadius: 12,
        padding: '2rem',
        border: '1px solid #3a3632',
      }}>
        <h2 style={{ color: '#d4a060', fontSize: '1.5rem', marginBottom: '1rem', fontFamily: 'serif' }}>
          Get in Touch
        </h2>
        <Story />
      </div>
    ),
  ],
};
