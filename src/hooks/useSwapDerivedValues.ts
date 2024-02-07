import { useSelector } from 'react-redux';
import { AppState } from '@/redux/store';
import { SwapModalField } from '@/redux/swap';

export default function useSwapDerivedValues() {
  const derivedValues: { [key in SwapModalField]: string | null } = useSelector((state: AppState) => state.swap.derivedValues);

  return {
    derivedValues,
  };
}
