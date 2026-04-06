import type { Meta, StoryObj } from '@storybook/react-vite';
import { Link } from '../components/Link';

const meta: Meta<typeof Link> = {
  title: 'Components/Link',
  component: Link,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Link>;

export const Default: Story = {
  args: {
    href: 'https://www.baidu.com',
    children: '前往 Example.com',
  },
};

export const CustomClass: Story = {
  args: {
    href: 'https://www.qq.com',
    children: '加粗链接',
    className: 'font-bold',
  },
};
