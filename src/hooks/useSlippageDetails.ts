import { convertBipsToPercentage } from '../helpers/utilities';
import { colors } from '../styles';

const SlippageWarningThresholdInBips = 500;
const SevereSlippageThresholdInBips = SlippageWarningThresholdInBips * 2;

const SlippageColors = {
  high: colors.warning,
  normal: colors.green,
  severe: colors.red,
};

export default function useSlippageDetails(slippage) {
  const isHighSlippage = slippage >= SlippageWarningThresholdInBips;
  const isSevereSlippage = slippage > SevereSlippageThresholdInBips;

  let color = SlippageColors.normal;
  if (isSevereSlippage) {
    color = SlippageColors.severe;
  } else if (isHighSlippage) {
    color = SlippageColors.high;
  }

  return {
    color,
    isHighSlippage,
    percentDisplay: convertBipsToPercentage(slippage, 2),
  };
}
