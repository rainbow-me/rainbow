import { greaterThan, convertAmountToRawAmount } from '../helpers/utilities';
import { contractUtils, gasUtils } from '../utils';
import { get } from 'lodash';
import {
  tradeExactEthForTokensWithData,
  tradeEthForExactTokensWithData,
  tradeExactTokensForEthWithData,
  tradeTokensForExactEthWithData,
  tradeExactTokensForTokensWithData,
  tradeTokensForExactTokensWithData,
} from '@uniswap/sdk';
import { executeSwap, estimateSwapGasLimit } from '../handlers/uniswap';

/**
 * @desc Swap two assets on Uniswap
 * @param  {String} fromAsset,
 * @param  {String} toAsset,
 * @param  {Object} inputAmount,
 * @param  {Object} outputAmount,
 * @param  {Object} gas,
 * @return {Promise}
 */
const swapOnUniswap = async (
  wallet,
  inputCurrency,
  outputCurrency,
  inputAmount,
  outputAmount,
  selectedGasPrice,
  gasPrices,
  inputAsExactAmount,
  inputReserve,
  outputReserve
) => {
  const {
    address: inputAddress,
    decimals: inputDecimals,
    exchangeAddress,
  } = inputCurrency;

  const { address: outputAddress, decimals: outputDecimals } = outputCurrency;

  let allowance = 0;

  let needsUnlocking = true;
  const isInputEth = inputAddress === 'eth';
  const isOutputEth = outputAddress === 'eth';
  // 1  - Check allowance and see if we need to "unlock" the asset
  //  1.1 - ETH doesn't need unlocking
  if (isInputEth) {
    needsUnlocking = false;
  } else {
    //  1.2 - check the current allowance
    allowance = await contractUtils.getAllowance(
      wallet.address,
      { address: inputAddress, decimals: inputDecimals },
      exchangeAddress
    );
  }
  needsUnlocking = !greaterThan(allowance, 0);

  if (needsUnlocking) {
    //  1.3 - Deal with approval first
    console.log('we should unlock');
    const fastGasPrice = get(gasPrices, `[${gasUtils.FAST}]`);

    const gasLimit = await contractUtils.estimateApprove(
      inputAddress,
      exchangeAddress
    );
    const { approval } = await contractUtils.approve(
      inputAddress,
      exchangeAddress,
      gasLimit,
      get(fastGasPrice, 'value.amount'),
      wallet
    );

    console.log('APPROVAL SUBMITTED, HASH', approval.hash);
    console.log('WAITING TO BE MINED...');
    await approval.wait();
    console.log('APPROVAL READY, LETS GOOO');
  } else {
    console.log('No need to unlock');
  }

  //  2 - Swap
  // 2.1 - Get Trade Details
  const rawInputAmount = convertAmountToRawAmount(
    parseFloat(inputAmount) || 0,
    inputDecimals
  );

  const rawOutputAmount = convertAmountToRawAmount(
    parseFloat(outputAmount) || 0,
    outputDecimals
  );

  let tradeDetails = null;
  const chainId = get(wallet, 'provider.chainId');

  if (isInputEth && !isOutputEth) {
    tradeDetails = inputAsExactAmount
      ? tradeExactEthForTokensWithData(outputReserve, rawInputAmount, chainId)
      : tradeEthForExactTokensWithData(outputReserve, rawOutputAmount, chainId);
  } else if (!isInputEth && isOutputEth) {
    tradeDetails = inputAsExactAmount
      ? tradeExactTokensForEthWithData(inputReserve, rawInputAmount, chainId)
      : tradeTokensForExactEthWithData(inputReserve, rawOutputAmount, chainId);
  } else if (!isInputEth && !isOutputEth) {
    tradeDetails = inputAsExactAmount
      ? tradeExactTokensForTokensWithData(
          inputReserve,
          outputReserve,
          rawInputAmount,
          chainId
        )
      : tradeTokensForExactTokensWithData(
          inputReserve,
          outputReserve,
          rawOutputAmount,
          chainId
        );
  }

  // 2.2 - Execute Swap
  const gasPrice = get(selectedGasPrice, 'value.amount');
  const gasLimit = await estimateSwapGasLimit(wallet.address, tradeDetails);

  console.log('About to execute swap with', {
    gasLimit,
    gasPrice,
    tradeDetails,
    wallet,
  });

  return executeSwap(tradeDetails, gasLimit, gasPrice, wallet);
};

export default swapOnUniswap;
