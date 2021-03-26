import { useSelector } from 'react-redux';

export default function useAnnualizedFees(address) {
  return useSelector(state => state.uniswapLiquidity.annualizedFees[address]);
}
