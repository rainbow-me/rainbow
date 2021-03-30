import { useSelector } from 'react-redux';

export default function usePoolDetails(address) {
  return useSelector(state => state.uniswapLiquidity.poolsDetails[address]);
}
