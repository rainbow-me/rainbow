import { useMemo } from 'react';
import useSwapDetails from './useSwapDetails';
import { useTheme } from '@rainbow-me/context';
import { convertBipsToPercentage } from '@rainbow-me/utilities';

const SlippageWarningThresholdInBips = 500;
const SevereSlippageThresholdInBips = SlippageWarningThresholdInBips * 2;

export default function useSlippageDetails() {
  const { slippage } = useSwapDetails();
  const { colors } = useTheme();

  const isHighSlippage = slippage >= SlippageWarningThresholdInBips;
  const isSevereSlippage = slippage > SevereSlippageThresholdInBips;

  const color = useMemo(() => {
    if (isSevereSlippage) return colors.red;
    if (isHighSlippage) return colors.warning;
    return colors.green;
  }, [colors, isHighSlippage, isSevereSlippage]);

  return {
    color,
    isHighSlippage,
    percentDisplay: convertBipsToPercentage(slippage, 2),
  };
}
