import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Accordion, AccordionGroup } from './Accordion';

const meta = {
  title: 'Primitives/Accordion',
  component: Accordion,
  tags: ['autodocs'],
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'What is 8PM?',
    children: '8PM is a free live music streaming platform powered by Archive.org recordings.',
  },
};

export const DefaultOpen: Story = {
  args: {
    title: 'Already Open',
    defaultOpen: true,
    children: 'This accordion starts in the open state.',
  },
};

export const WithIcon: Story = {
  args: {
    title: 'With Icon',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    children: 'This accordion has an icon in the header.',
  },
};

export const Group: Story = {
  render: () => (
    <AccordionGroup>
      <Accordion id="faq-1" title="How do I search for shows?">
        Use the search bar or press K to open the search overlay.
      </Accordion>
      <Accordion id="faq-2" title="Is this free?">
        Yes! All recordings are freely available from Archive.org.
      </Accordion>
      <Accordion id="faq-3" title="Can I download recordings?">
        Visit the original Archive.org page for download options.
      </Accordion>
    </AccordionGroup>
  ),
};

export const GroupMultiple: Story = {
  render: () => (
    <AccordionGroup allowMultiple>
      <Accordion id="multi-1" title="Section One">
        Content for section one. Multiple sections can be open at once.
      </Accordion>
      <Accordion id="multi-2" title="Section Two">
        Content for section two.
      </Accordion>
      <Accordion id="multi-3" title="Section Three">
        Content for section three.
      </Accordion>
    </AccordionGroup>
  ),
};
