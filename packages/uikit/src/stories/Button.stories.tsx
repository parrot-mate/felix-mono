import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../components/Button';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Violet: Story = {
  args: {
    children: '紫罗兰按钮',
    variant: "plain",
    onClick: () => alert('点击了紫罗兰按钮'),
  },
};

// export const PinkLily: Story = {
//   args: {
//     children: '小粉按钮',
//     variant: 'pinkLily',
//     onClick: () => alert('点击了小粉按钮'),
//   },
// };

// export const SkyAlex: Story = {
//   args: {
//     children: '天蓝按钮',
//     variant: 'skyAlex',
//     onClick: () => alert('点击了天蓝按钮'),
//   },
// };

export const Disabled: Story = {
  args: {
    children: '禁用按钮',
    variant: 'secondary',
    disabled: true,
    onClick: () => {},
  },
};
