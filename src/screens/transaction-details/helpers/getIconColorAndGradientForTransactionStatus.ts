import { TransactionStatus } from '@/entities';
import { ThemeContextProps } from '@/theme';

export function getIconColorAndGradientForTransactionStatus(
  colors: ThemeContextProps['colors'],
  status?: TransactionStatus
): {
  icon: string;
  color: 'red' | 'blue' | 'labelSecondary';
  gradient: string[];
} {
  if (status === TransactionStatus.pending) {
    return {
      icon: '􀖇',
      color: 'labelSecondary',
      gradient: colors.gradients.transparentToLightGrey,
    };
  } else if (status === TransactionStatus.failed) {
    return {
      icon: '􀆄',
      color: 'red',
      gradient: colors.gradients.transparentToRed,
    };
  }
  return {
    icon: '􀆅',
    color: 'blue',
    gradient: colors.gradients.transparentToAppleBlue,
  };
}
