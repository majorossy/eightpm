import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import BandMembers from './BandMembers';
import { mockBandMembers, mockFormerMembers } from '../../.storybook/fixtures';

const meta = {
  title: 'Artist/BandMembers',
  component: BandMembers,
  tags: ['autodocs'],
} satisfies Meta<typeof BandMembers>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    members: mockBandMembers.filter(m => m.years.includes('present')),
    formerMembers: mockFormerMembers,
  },
};

export const CurrentOnly: Story = {
  args: {
    members: mockBandMembers.filter(m => m.years.includes('present')),
  },
};

export const FormerOnly: Story = {
  args: {
    formerMembers: mockFormerMembers,
  },
};

export const WithBios: Story = {
  args: {
    members: [
      { name: 'Todd Sheaffer', role: 'Vocals, Guitar', years: '2001-present', bio: 'Founding member and primary songwriter.' },
      { name: 'Tim Carbone', role: 'Violin, Vocals', years: '2001-present', bio: 'Known for electrifying violin solos.' },
    ],
    formerMembers: [
      { name: 'Andy Goessling', role: 'Multi-instrumentalist', years: '2001-2018', bio: 'Played guitar, banjo, flute, and more.' },
    ],
  },
};

export const NoMembers: Story = {
  args: {},
};
