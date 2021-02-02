import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '@rainbow-me/context';
import { Numberish } from '@rainbow-me/entities';
import { AppState } from '@rainbow-me/redux/store';
import { updateSlippage as updateSwapSlippage } from '@rainbow-me/redux/swap';
import { convertBipsToPercentage } from '@rainbow-me/utilities';

const SlippageWarningThresholdInBips = 500;
const SevereSlippageThresholdInBips = SlippageWarningThresholdInBips * 2;

export default function useSlippageDetails() {
  const dispatch = useDispatch();
  const tradeDetails = useSelector(
    (state: AppState) => state.swap.tradeDetails
  );
  const { colors } = useTheme();
  const slippage = useSelector((state: AppState) => state.swap.slippage);

  const isHighSlippage = slippage >= SlippageWarningThresholdInBips;
  const isSevereSlippage = slippage > SevereSlippageThresholdInBips;

  const color = isSevereSlippage
    ? colors.red
    : isHighSlippage
    ? colors.orange
    : colors.green;

  const updateSlippage = useCallback(() => {
    const slippage = tradeDetails?.priceImpact
      ? Number(tradeDetails?.priceImpact?.toFixed(2).toString()) * 100
      : 0;
    dispatch(updateSwapSlippage(slippage));
  }, [dispatch, tradeDetails]);


  return {
    color,
    isHighSlippage,
    percentDisplay: convertBipsToPercentage(slippage, 2),
    slippage,
    updateSlippage,
  };
}
