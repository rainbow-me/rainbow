import { captureException } from '@sentry/react-native';
import { RapActionParameters, SetNameENSActionParameters } from '../common';
import { estimateENSSetNameGasLimit } from '@rainbow-me/handlers/ens';
import { toHex } from '@rainbow-me/handlers/web3';
import {
  ENSRegistrationTransactionType,
  getENSExecutionDetails,
} from '@rainbow-me/helpers/ens';
import { dataAddNewTransaction } from '@rainbow-me/redux/data';
import store from '@rainbow-me/redux/store';
import logger from 'logger';

const executeSetName = async (
  name: string,
  ownerAddress: string,
  gasLimit: string | null,
  maxFeePerGas: string,
  maxPriorityFeePerGas: string,
  nonce: number | null = null
) => {
  const { contract, methodArguments, value } = await getENSExecutionDetails({
    name,
    ownerAddress,
    type: ENSRegistrationTransactionType.SET_NAME,
  });

  return contract?.setText(methodArguments, {
    gasLimit: gasLimit ? toHex(gasLimit) : undefined,
    maxFeePerGas: toHex(maxFeePerGas) || undefined,
    maxPriorityFeePerGas: toHex(maxPriorityFeePerGas) || undefined,
    nonce: nonce ? toHex(nonce) : undefined,
    ...(value ? { value } : {}),
  });
};

const actionName = 'setNameENS';

const setNameENS = async (
  index: number,
  parameters: RapActionParameters,
  baseNonce?: number
): Promise<number | undefined> => {
  logger.log(`[${actionName}] base nonce`, baseNonce, 'index:', index);
  const { dispatch } = store;
  const { accountAddress: ownerAddress } = store.getState().settings;
  const { selectedGasFee } = store.getState().gas;
  const { name } = parameters as SetNameENSActionParameters;

  logger.log(`[${actionName}] rap for`, name);

  let gasLimit;
  try {
    logger.sentry(`[${actionName}] estimate gas`, {
      name,
      ownerAddress,
    });
    gasLimit = await estimateENSSetNameGasLimit(name, ownerAddress);
  } catch (e) {
    logger.sentry(`[${actionName}] Error estimating gas`);
    captureException(e);
    throw e;
  }
  let setName;
  let maxFeePerGas;
  let maxPriorityFeePerGas;
  try {
    let maxFeePerGas = selectedGasFee?.gasFeeParams?.maxFeePerGas?.amount;
    let maxPriorityFeePerGas =
      selectedGasFee?.gasFeeParams?.maxPriorityFeePerGas?.amount;

    logger.sentry(`[${actionName}] about to execute`, {
      name,
      setName,
    });
    const nonce = baseNonce ? baseNonce + index : null;

    setName = await executeSetName(
      name,
      ownerAddress,
      gasLimit,
      maxFeePerGas,
      maxPriorityFeePerGas,
      nonce
    );
  } catch (e) {
    logger.sentry(`[${actionName}] Error executing`);
    captureException(e);
    throw e;
  }

  logger.log(`[${actionName}] response`, setName);

  const newTransaction = {
    amount: 0,
    data: setName.data,
    from: ownerAddress,
    gasLimit,
    hash: setName?.hash,
    maxFeePerGas,
    maxPriorityFeePerGas,
    nonce: setName?.nonce,
    to: setName?.to,
    value: toHex(setName.value),
  };
  logger.log(`[${actionName}] adding new txn`, newTransaction);
  // @ts-expect-error Since src/redux/data.js is not typed yet, `accountAddress`
  // being a string conflicts with the inferred type of "null" for the second
  // parameter.
  await dispatch(dataAddNewTransaction(newTransaction, ownerAddress));
  return setName?.nonce;
};

export default setNameENS;
