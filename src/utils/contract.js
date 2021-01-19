import { arrayify } from '@ethersproject/bytes';
import { Contract } from '@ethersproject/contracts';
import { fill, join } from 'lodash';
import { web3Provider } from '@rainbow-me/handlers/web3';
import {
  smartContractMethods,
  WETH_ADDRESS,
  ZAP_IN_ABI,
  ZapInAddress,
  ZERO_ADDRESS,
} from '@rainbow-me/references';
import { ethereumUtils } from '@rainbow-me/utils';

import logger from 'logger';

const depositEthToZap = async (
  pairAddress,
  minPoolTokens,
  ethValue,
  fromAmount = 0
) => {
  const swapTarget = WETH_ADDRESS;
  const allowanceTarget = WETH_ADDRESS;

  // 224 bytes = 7 (6 args and offset indicator itself) * 32 bytes
  const offsetBytes = 224;
  const dataBytes = 4;

  const offset = ethereumUtils.padLeft(offsetBytes.toString(16), 64);
  const dataLength = ethereumUtils.padLeft(dataBytes.toString(16), 64);
  const depositFunction = ethereumUtils.removeHexPrefix(
    smartContractMethods.deposit.hash
  );

  const rawSwapData = `${offset}${dataLength}${depositFunction}`;
  const remainingPaddingLength = 64 - (rawSwapData.length % 64);
  const remainingPadding = join(fill(Array(remainingPaddingLength), '0'), '');
  const swapData = `${rawSwapData}${remainingPadding}`;
  const swapDataBytes = arrayify('0x' + swapData);

  const zapInContract = new Contract(ZapInAddress, ZAP_IN_ABI, web3Provider);
  try {
    const lpTokensBought = await zapInContract.callStatic.ZapIn(
      ZERO_ADDRESS,
      pairAddress,
      fromAmount,
      minPoolTokens,
      allowanceTarget,
      swapTarget,
      swapDataBytes,
      { value: ethValue }
    );
    return lpTokensBought.toString();
  } catch (error) {
    logger.log('Error depositing ETH to zap', error);
  }
};

export default {
  depositEthToZap,
};
