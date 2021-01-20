import { arrayify } from '@ethersproject/bytes';
import { Contract } from '@ethersproject/contracts';
import { fill, join } from 'lodash';
import { addHexPrefix, web3Provider } from './web3';
import { ZeroExPayload } from '@rainbow-me/entities';
import { ZAP_IN_ABI, ZapInAddress, ZERO_ADDRESS } from '@rainbow-me/references';
import { ethereumUtils } from '@rainbow-me/utils';
import logger from 'logger';

export const depositToZap = async (
  pairAddress: string,
  firstSwapDetails: ZeroExPayload,
  minPoolTokens: string,
  ethValue: string,
  fromAddress = ZERO_ADDRESS,
  fromAmount = '0'
) => {
  const { swapTarget, allowanceTarget, swapPayload } = firstSwapDetails;
  const rawSwapPayload = ethereumUtils.removeHexPrefix(swapPayload);

  // 224 bytes = 7 (6 args and offset indicator itself) * 32 bytes
  const offsetBytes = 224;
  const dataBytes = rawSwapPayload.length / 2;

  const offset = ethereumUtils.padLeft(offsetBytes.toString(16), 64);
  const dataLength = ethereumUtils.padLeft(dataBytes.toString(16), 64);

  const rawSwapData = `${offset}${dataLength}${rawSwapPayload}`;
  const remainingPaddingLength = 64 - (rawSwapData.length % 64);
  const remainingPadding = join(fill(Array(remainingPaddingLength), '0'), '');
  const swapData = `${rawSwapData}${remainingPadding}`;
  const swapDataBytes = arrayify(addHexPrefix(swapData));

  const zapInContract = new Contract(ZapInAddress, ZAP_IN_ABI, web3Provider);
  try {
    const lpTokensBought = await zapInContract.callStatic.ZapIn(
      fromAddress,
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
