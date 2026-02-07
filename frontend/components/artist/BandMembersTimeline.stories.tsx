import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import BandMembersTimeline from './BandMembersTimeline';
import { mockBandMembers, mockFormerMembers } from '../../.storybook/fixtures';

const meta = {
  title: 'Artist/BandMembersTimeline',
  component: BandMembersTimeline,
  tags: ['autodocs'],
} satisfies Meta<typeof BandMembersTimeline>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    members: mockBandMembers.filter(m => m.years.includes('present')),
    formerMembers: mockFormerMembers,
    foundedYear: 2001,
  },
};

export const WithoutFoundedYear: Story = {
  args: {
    members: mockBandMembers.filter(m => m.years.includes('present')),
    formerMembers: mockFormerMembers,
  },
};

export const CurrentMembersOnly: Story = {
  args: {
    members: [
      { name: 'Todd Sheaffer', role: 'Vocals, Guitar', years: '2001-present' },
      { name: 'Tim Carbone', role: 'Violin, Vocals', years: '2001-present' },
      { name: 'Carey Harmon', role: 'Drums', years: '2001-present' },
    ],
    foundedYear: 2001,
  },
};

export const ManyLineupChanges: Story = {
  args: {
    members: [
      { name: 'Todd Sheaffer', role: 'Vocals, Guitar', years: '2001-present' },
      { name: 'Andrew Altman', role: 'Bass', years: '2003-present' },
      { name: 'Matt Kohut', role: 'Bass', years: '2019-present' },
    ],
    formerMembers: [
      { name: 'Dave Von Dollen', role: 'Bass', years: '2001-2003' },
      { name: 'Andy Goessling', role: 'Multi-instrumentalist', years: '2001-2018' },
      { name: 'Mark Johnson', role: 'Keyboards', years: '2005-2012' },
    ],
    foundedYear: 2001,
  },
};

export const NoMembers: Story = {
  args: {},
};
