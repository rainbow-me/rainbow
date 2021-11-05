import { BigNumber } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import logger from 'logger';

//ETH:  29001000000000000000 in GWEI
//WETH: 29001000000000000000 also in GWEI, display as ETH
//DAI:  38690000000000000000
//USDC: 214000000
export default function formatAssetForDisplay({ amount, token }) {
  let price = 0;

  switch (token) {
    case 'USDC':
      price = formatUnits(BigNumber.from(amount), 6);
      //   logger.debug('USDC PRICE: ', price);
      break;
    case 'ETH':
      price = formatUnits(BigNumber.from(amount), 18);
      //   logger.debug('ETH PRICE: ', price);
      break;
    case 'WETH':
      price = formatUnits(BigNumber.from(amount), 18);
      //   logger.debug('WETH PRICE: ', price);
      break;
    case 'DAI':
      price = formatUnits(BigNumber.from(amount), 18);
      //   logger.debug('DAI PRICE: ', price);
      break;
    default:
      logger.log('yep');
      break;
  }

  return String(price);
}
