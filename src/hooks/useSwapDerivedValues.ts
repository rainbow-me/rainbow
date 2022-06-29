import { useSelector } from 'react-redux';
import { AppState } from '@rainbow-me/redux/store';
import { SwapModalField } from '@rainbow-me/redux/swap';

export default function useSwapDerivedValues() {
  const derivedValues: { [key in SwapModalField]: string | null } = useSelector(
    (state: AppState) => state.swap.derivedValues
  );

  return {
    derivedValues,
  };
}
