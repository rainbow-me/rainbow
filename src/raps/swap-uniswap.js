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
import { greaterThan, convertAmountToRawAmount } from '../helpers/utilities';
import store from '../redux/store';
import { contractUtils, gasUtils } from '../utils';
import { rapsAddOrUpdate, rapsLoadState } from '../redux/raps';
import {
  uniswapUpdateInputCurrency,
  uniswapUpdateOutputCurrency,
} from '../redux/uniswap';
import { web3UpdateReserves } from '../redux/web3listener';

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
  selectedGasPrice = null,
  inputAsExactAmount,
  rap = null
) => {
  let currentRap = rap;
  const { dispatch } = store;
  const { gasPrices } = store.getState().gas;
  // It's a new rap, simple unlock(?) & swap
  if (currentRap === null) {
    const now = new Date().getTime();
    currentRap = {
      completed_at: null,
      id: `rap_${now}`,
      parameters: {
        inputAmount,
        inputAsExactAmount,
        inputCurrency,
        outputAmount,
        outputCurrency,
        selectedGasPrice,
      },
      started_at: now,
      transactions: {
        swap: { confirmed: null, hash: null },
      },
      type: 'swap-uniswap',
    };

    console.log('Storing new rap', currentRap);
    dispatch(rapsAddOrUpdate(currentRap.id, currentRap));
  } else {
    // It's part of a bigger rap, let's load it
    const raps = await dispatch(rapsLoadState());
    currentRap = raps[rap];
  }

  const {
    address: inputAddress,
    decimals: inputDecimals,
    exchangeAddress,
  } = inputCurrency;

  const { address: outputAddress, decimals: outputDecimals } = outputCurrency;

  await dispatch(uniswapUpdateInputCurrency(inputCurrency));
  await dispatch(uniswapUpdateOutputCurrency(outputCurrency));
  const { inputReserve, outputReserve } = await dispatch(web3UpdateReserves());

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

  // needsUnlocking = !greaterThan(allowance, 0);
  // ONLY FOR TESTING PURPOSES
  //needsUnlocking = true;

  if (needsUnlocking) {
    //  1.3 - Deal with approval first
    console.log('we should unlock');
    const fastGasPrice = get(gasPrices, `[${gasUtils.FAST}]`);

    const gasLimit = await contractUtils.estimateApprove(
      inputAddress,
      exchangeAddress
    );

    currentRap.transactions.approval = { confirmed: null, hash: null };
    console.log('Adding approval to rap', currentRap);
    dispatch(rapsAddOrUpdate(currentRap.id, currentRap));

    const { approval } = await contractUtils.approve(
      inputAddress,
      exchangeAddress,
      gasLimit,
      get(fastGasPrice, 'value.amount'),
      wallet
    );

    currentRap.transactions.approval = approval.hash;
    dispatch(rapsAddOrUpdate(currentRap.id, currentRap));

    console.log('APPROVAL SUBMITTED, HASH', approval.hash);
    console.log('WAITING TO BE MINED...');
    await approval.wait();
    currentRap.transactions.approval.confirmed = true;
    dispatch(rapsAddOrUpdate(currentRap.id, currentRap));
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

  let gasPrice = get(selectedGasPrice, 'value.amount');
  if (!gasPrice) {
    gasPrice = get(gasPrices, `[${gasUtils.FAST}]`);
  }
  const gasLimit = await estimateSwapGasLimit(wallet.address, tradeDetails);

  console.log('About to execute swap with', {
    gasLimit,
    gasPrice,
    tradeDetails,
    wallet,
  });

  const swap = await executeSwap(tradeDetails, gasLimit, gasPrice, wallet);
  currentRap.transactions.swap.hash = swap.hash;
  dispatch(rapsAddOrUpdate(currentRap.id, currentRap));
  return { rap: currentRap, swap };
};

export default swapOnUniswap;
