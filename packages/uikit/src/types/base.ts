export interface BaseComponentProps {
  className?: string;
  id?: string;
  styles?: React.CSSProperties;
  variant?: string;
}

export interface IconProps {
  onClick?: () => void;
  className?: string;
  fill?: string;
  style?: React.CSSProperties;
}
