import { EthereumAddress } from '.';

interface UniswapPairTokenData {
  derivedETH: string;
  id: EthereumAddress;
  name: string;
  symbol: string;
  totalLiquidity: string;
  // returned in all tokens call
  decimals?: string;
}
interface UniswapPairData {
  id: EthereumAddress;
  reserve0: string;
  reserve1: string;
  reserveUSD: string;
  token0: UniswapPairTokenData;
  token1: UniswapPairTokenData;
  totalSupply: string;
  trackedReserveETH: string;
  volumeUSD: string;
}
interface UniswapPairHistoricalData
  extends Omit<UniswapPairData, 'token0' | 'token1'> {
  token0: { derivedETH: string };
  token1: { derivedETH: string };
}
export interface UniswapPoolData {
  oneDayBlock: string;
  oneDayHistory: UniswapPairHistoricalData;
  oneMonthHistory: UniswapPairHistoricalData;
  pair: UniswapPairData;
}
