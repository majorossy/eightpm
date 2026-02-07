import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from '@storybook/test';
import { CustomSelect } from './CustomSelect';

const yearOptions = [
  { value: '', label: 'All Years' },
  { value: '2024', label: '2024' },
  { value: '2023', label: '2023' },
  { value: '2022', label: '2022' },
  { value: '2021', label: '2021' },
  { value: '2020', label: '2020' },
];

const meta = {
  title: 'Forms/CustomSelect',
  component: CustomSelect,
  tags: ['autodocs'],
  args: {
    onChange: fn(),
  },
} satisfies Meta<typeof CustomSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    options: yearOptions,
    value: '',
    placeholder: 'Select year...',
  },
};

export const WithSelection: Story = {
  args: {
    options: yearOptions,
    value: '2023',
    placeholder: 'Select year...',
  },
};

export const Disabled: Story = {
  args: {
    options: yearOptions,
    value: '2024',
    disabled: true,
  },
};

export const WithIcons: Story = {
  args: {
    options: [
      { value: '', label: 'All Artists' },
      {
        value: 'railroadearth',
        label: 'Railroad Earth',
        icon: (
          <svg className="w-4 h-4 text-[#6a6050]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        ),
      },
      {
        value: 'gratefuldead',
        label: 'Grateful Dead',
        icon: (
          <svg className="w-4 h-4 text-[#6a6050]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        ),
      },
    ],
    value: '',
    placeholder: 'All Artists',
  },
};
