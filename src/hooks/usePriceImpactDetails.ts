import { useSelector } from 'react-redux';
import { useTheme } from '@rainbow-me/context';
import { AppState } from '@rainbow-me/redux/store';
import { convertBipsToPercentage } from '@rainbow-me/utilities';

const SlippageWarningThresholdInBips = 500;
const SevereSlippageThresholdInBips = SlippageWarningThresholdInBips * 2;

export default function useSlippageDetails() {
  const { colors } = useTheme();
  const slippage = useSelector((state: AppState) => state.swap.slippage);

  const isHighSlippage = slippage >= SlippageWarningThresholdInBips;
  const isSevereSlippage = slippage > SevereSlippageThresholdInBips;

  const color = isSevereSlippage
    ? colors.red
    : isHighSlippage
    ? colors.orange
    : colors.green;

  return {
    color,
    isHighSlippage,
    percentDisplay: convertBipsToPercentage(slippage, 2),
    slippage,
  };
}
