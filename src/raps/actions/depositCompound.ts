import { Contract } from '@ethersproject/contracts';
import { Wallet } from '@ethersproject/wallet';
import { captureException } from '@sentry/react-native';
import { get } from 'lodash';
import { DepositActionParameters, Rap, RapActionParameters } from '../common';
import { Asset } from '@rainbow-me/entities';
import { toHex } from '@rainbow-me/handlers/web3';
import ProtocolTypes from '@rainbow-me/helpers/protocolTypes';
import TransactionStatusTypes from '@rainbow-me/helpers/transactionStatusTypes';
import TransactionTypes from '@rainbow-me/helpers/transactionTypes';
import { dataAddNewTransaction } from '@rainbow-me/redux/data';
import store from '@rainbow-me/redux/store';
import {
  compoundCERC20ABI,
  compoundCETHABI,
  ethUnits,
  savingsAssetsListByUnderlying,
} from '@rainbow-me/references';
import { convertAmountToRawAmount } from '@rainbow-me/utilities';
import { gasUtils } from '@rainbow-me/utils';
import logger from 'logger';

export const getDepositGasLimit = (inputCurrency: Asset) =>
  inputCurrency.address === 'eth'
    ? ethUnits.basic_deposit_eth
    : ethUnits.basic_deposit;

const depositCompound = async (
  wallet: Wallet,
  currentRap: Rap,
  index: number,
  parameters: RapActionParameters
): Promise<null> => {
  logger.log('[deposit]');
  const {
    accountAddress,
    inputAmount,
    inputCurrency,
    network,
    selectedGasPrice,
  } = parameters as DepositActionParameters;
  const { dispatch } = store;
  const { gasPrices } = store.getState().gas;
  logger.log('[deposit]', inputAmount);
  const rawInputAmount = convertAmountToRawAmount(
    inputAmount,
    inputCurrency.decimals
  );
  logger.log('[deposit] raw input amount', rawInputAmount);

  logger.log('[deposit] execute the deposit');
  let gasPrice = get(selectedGasPrice, 'value.amount');
  if (!gasPrice) {
    gasPrice = get(gasPrices, `[${gasUtils.FAST}].value.amount`);
  }
  logger.log('[deposit] gas price', gasPrice);

  const cTokenContract =
    savingsAssetsListByUnderlying[network][inputCurrency.address]
      .contractAddress;
  logger.log('ctokencontract', cTokenContract);

  const compound = new Contract(
    cTokenContract,
    inputCurrency.address === 'eth' ? compoundCETHABI : compoundCERC20ABI,
    wallet
  );

  const transactionParams = {
    gasLimit: getDepositGasLimit(inputCurrency),
    gasPrice: toHex(gasPrice) || undefined,
    value: toHex(0),
  };

  let deposit = null;
  try {
    logger.sentry('[deposit] txn params', transactionParams);
    deposit = await compound.mint(rawInputAmount, transactionParams);
    logger.sentry('[deposit] minted - result', deposit);
  } catch (e) {
    logger.sentry('error executing compound.mint');
    captureException(e);
    throw e;
  }
  currentRap.actions[index].transaction.hash = deposit.hash;

  const newTransaction = {
    amount: inputAmount,
    asset: inputCurrency,
    from: accountAddress,
    gasLimit: transactionParams.gasLimit,
    gasPrice: transactionParams.gasPrice,
    hash: deposit.hash,
    nonce: get(deposit, 'nonce'),
    protocol: ProtocolTypes.compound.name,
    status: TransactionStatusTypes.depositing,
    to: get(deposit, 'to'),
    type: TransactionTypes.deposit,
  };
  logger.log('[deposit] adding new txn', newTransaction);
  // Disable the txn watcher because Compound can silently fail
  await dispatch(dataAddNewTransaction(newTransaction, accountAddress, true));

  currentRap.actions[index].transaction.hash = deposit.hash;
  logger.log('[deposit] rap complete');
  return null;
};

export default depositCompound;
