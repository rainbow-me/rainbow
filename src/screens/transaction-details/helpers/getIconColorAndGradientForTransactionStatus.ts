import { TransactionStatus } from '@/resources/transactions/types';
import { ThemeContextProps } from '@/theme';

export function getIconColorAndGradientForTransactionStatus(
  colors: ThemeContextProps['colors'],
  status?: TransactionStatus
): {
  icon: string;
  color: 'red' | 'blue' | 'labelSecondary';
  gradient: string[];
} {
  if (status === 'pending') {
    return {
      icon: '􀖇',
      color: 'labelSecondary',
      gradient: colors.gradients.transparentToLightGrey,
    };
  }
  if (status === 'failed') {
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
