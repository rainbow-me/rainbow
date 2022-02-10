import { Wallet } from '@ethersproject/wallet';
import { captureException } from '@sentry/react-native';
import { CommitENSActionParameters, Rap, RapActionParameters } from '../common';
import { estimateENSCommitGasLimit } from '@rainbow-me/handlers/ens';
import { toHex } from '@rainbow-me/handlers/web3';
import {
  ENSRegistrationTransactionType,
  getENSExecutionDetails,
} from '@rainbow-me/helpers/ens';
import { dataAddNewTransaction } from '@rainbow-me/redux/data';
import store from '@rainbow-me/redux/store';
import logger from 'logger';

const executeCommit = async (
  name: string,
  duration: number,
  ownerAddress: string,
  rentPrice: string,
  gasLimit: string | null,
  maxFeePerGas: string,
  maxPriorityFeePerGas: string,
  nonce: number | null = null
) => {
  const { contract, methodArguments, value } = await getENSExecutionDetails({
    duration,
    name,
    ownerAddress,
    rentPrice,
    type: ENSRegistrationTransactionType.COMMIT,
  });

  return contract?.commit(methodArguments, {
    gasLimit: gasLimit ? toHex(gasLimit) : undefined,
    maxFeePerGas: toHex(maxFeePerGas) || undefined,
    maxPriorityFeePerGas: toHex(maxPriorityFeePerGas) || undefined,
    nonce: nonce ? toHex(nonce) : undefined,
    ...(value ? { value } : {}),
  });
};

const actionName = 'commitENS';

const commitENS = async (
  wallet: Wallet,
  currentRap: Rap,
  index: number,
  parameters: RapActionParameters,
  baseNonce?: number
): Promise<number | undefined> => {
  logger.log(`[${actionName}] base nonce`, baseNonce, 'index:', index);
  const { dispatch } = store;
  const { accountAddress } = store.getState().settings;
  const { selectedGasFee } = store.getState().gas;
  const { name, duration, rentPrice } = parameters as CommitENSActionParameters;

  logger.log(`[${actionName}] rap for`, name);

  let gasLimit;
  try {
    logger.sentry(`[${actionName}] estimate gas`, {
      duration,
      name,
      rentPrice,
    });
    gasLimit = await estimateENSCommitGasLimit(
      name,
      accountAddress,
      duration,
      rentPrice
    );
  } catch (e) {
    logger.sentry(`[${actionName}] Error estimating gas`);
    captureException(e);
    throw e;
  }
  let commit;
  let maxFeePerGas;
  let maxPriorityFeePerGas;
  try {
    let maxFeePerGas = selectedGasFee?.gasFeeParams?.maxFeePerGas?.amount;
    let maxPriorityFeePerGas =
      selectedGasFee?.gasFeeParams?.maxPriorityFeePerGas?.amount;

    logger.sentry(`[${actionName}] about to commit`, {
      duration,
      name,
      rentPrice,
    });
    const nonce = baseNonce ? baseNonce + index : null;

    commit = await executeCommit(
      name,
      duration,
      accountAddress,
      rentPrice,
      gasLimit,
      maxFeePerGas,
      maxPriorityFeePerGas,
      nonce
    );
  } catch (e) {
    logger.sentry(`[${actionName}] Error approving`);
    captureException(e);
    throw e;
  }

  logger.log(`[${actionName}] response`, commit);

  const newTransaction = {
    amount: 0,
    data: commit.data,
    from: accountAddress,
    gasLimit,
    hash: commit?.hash,
    maxFeePerGas,
    maxPriorityFeePerGas,
    nonce: commit?.nonce,
    to: commit?.to,
    value: toHex(commit.value),
  };
  logger.log(`[${actionName}] adding new txn`, newTransaction);
  // @ts-expect-error Since src/redux/data.js is not typed yet, `accountAddress`
  // being a string conflicts with the inferred type of "null" for the second
  // parameter.
  await dispatch(dataAddNewTransaction(newTransaction, accountAddress));
  return commit?.nonce;
};

export default commitENS;
