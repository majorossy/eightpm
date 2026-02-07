import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import DetailedCassette from './DetailedCassette';

const meta = {
  title: 'Artist/DetailedCassette',
  component: DetailedCassette,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ position: 'relative', width: 320, height: 240, margin: '2rem auto' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DetailedCassette>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    artistName: 'Railroad Earth',
    location: 'Stillwater, NJ',
    year: '2001',
  },
};

export const TopCassette: Story = {
  args: {
    artistName: 'Railroad Earth',
    artistFullName: 'Railroad Earth',
    location: 'Stillwater, NJ',
    year: '2001',
    isTop: true,
    rotation: 2,
  },
};

export const WithFullName: Story = {
  args: {
    artistName: 'RRE',
    artistFullName: 'Railroad Earth',
    location: 'Stillwater, NJ',
    year: '2001',
    isTop: true,
  },
};

export const CassetteStack: Story = {
  decorators: [
    (Story) => (
      <div style={{ position: 'relative', width: 340, height: 300, margin: '2rem auto' }}>
        <Story />
      </div>
    ),
  ],
  render: () => (
    <>
      <DetailedCassette artistName="RRE" offsetX={-15} offsetY={60} rotation={-8} />
      <DetailedCassette artistName="RRE" offsetX={25} offsetY={40} rotation={5} />
      <DetailedCassette artistName="RRE" offsetX={5} offsetY={20} rotation={-3} />
      <DetailedCassette artistName="Railroad Earth" isTop rotation={2} offsetX={15} offsetY={0} location="Stillwater, NJ" year="2001" />
    </>
  ),
};
