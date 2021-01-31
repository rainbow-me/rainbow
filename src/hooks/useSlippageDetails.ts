import { useMemo } from 'react';
import { convertBipsToPercentage } from '../helpers/utilities';

const SlippageWarningThresholdInBips = 500;
const SevereSlippageThresholdInBips = SlippageWarningThresholdInBips * 2;

export default function useSlippageDetails(slippage) {
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
