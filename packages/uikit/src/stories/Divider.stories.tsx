import type { Meta, StoryObj } from '@storybook/react-vite';
import { Divider } from '../components/Divider';

const meta: Meta<typeof Divider> = {
  title: 'Components/Divider',
  component: Divider,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Divider>;

export const Violet: Story = {
  args: {
    orientation: 'vertical',
    dashed: false,
    lengthClass: 'h-32',
  },
};
