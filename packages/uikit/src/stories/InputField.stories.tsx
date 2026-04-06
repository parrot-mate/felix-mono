import type { Meta, StoryObj } from '@storybook/react-vite';
import { InputField } from '../components/InputField';

const meta: Meta<typeof InputField> = {
  title: 'Components/InputField',
  component: InputField,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof InputField>;

export const Default: Story = {
  args: {
    type: 'text',
    placeholder: '请输入内容',
    variant: 'primary',
  },
};

export const Password: Story = {
  args: {
    type: 'password',
    placeholder: '请输入密码',
    variant: 'primary',
  },
};
