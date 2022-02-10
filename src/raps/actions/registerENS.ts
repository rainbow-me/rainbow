import { captureException } from '@sentry/react-native';
import { RapActionParameters, RegisterENSActionParameters } from '../common';
import { estimateENSRegisterWithConfigGasLimit } from '@rainbow-me/handlers/ens';
import { toHex } from '@rainbow-me/handlers/web3';
import {
  ENSRegistrationTransactionType,
  getENSExecutionDetails,
} from '@rainbow-me/helpers/ens';
import { dataAddNewTransaction } from '@rainbow-me/redux/data';
import store from '@rainbow-me/redux/store';
import logger from 'logger';

const executeRegisterWithConfig = async (
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
    type: ENSRegistrationTransactionType.REGISTER_WITH_CONFIG,
  });

  return contract?.registerWithConfig(methodArguments, {
    gasLimit: gasLimit ? toHex(gasLimit) : undefined,
    maxFeePerGas: toHex(maxFeePerGas) || undefined,
    maxPriorityFeePerGas: toHex(maxPriorityFeePerGas) || undefined,
    nonce: nonce ? toHex(nonce) : undefined,
    ...(value ? { value } : {}),
  });
};

const actionName = 'registerENS';

const registerENS = async (
  index: number,
  parameters: RapActionParameters,
  baseNonce?: number
): Promise<number | undefined> => {
  logger.log(`[${actionName}] base nonce`, baseNonce, 'index:', index);
  const { dispatch } = store;
  const { accountAddress: ownerAddress } = store.getState().settings;
  const { selectedGasFee } = store.getState().gas;
  const {
    name,
    duration,
    rentPrice,
  } = parameters as RegisterENSActionParameters;

  logger.log(`[${actionName}] rap for`, name);

  let gasLimit;
  try {
    logger.sentry(`[${actionName}] estimate gas`, {
      duration,
      name,
      rentPrice,
    });
    gasLimit = await estimateENSRegisterWithConfigGasLimit(
      name,
      ownerAddress,
      duration,
      rentPrice
    );
  } catch (e) {
    logger.sentry(`[${actionName}] Error estimating gas`);
    captureException(e);
    throw e;
  }
  let register;
  let maxFeePerGas;
  let maxPriorityFeePerGas;
  try {
    let maxFeePerGas = selectedGasFee?.gasFeeParams?.maxFeePerGas?.amount;
    let maxPriorityFeePerGas =
      selectedGasFee?.gasFeeParams?.maxPriorityFeePerGas?.amount;

    logger.sentry(`[${actionName}] about to execute`, {
      duration,
      name,
      rentPrice,
    });
    const nonce = baseNonce ? baseNonce + index : null;

    register = await executeRegisterWithConfig(
      name,
      duration,
      ownerAddress,
      rentPrice,
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

  logger.log(`[${actionName}] response`, register);

  const newTransaction = {
    amount: 0,
    data: register.data,
    from: ownerAddress,
    gasLimit,
    hash: register?.hash,
    maxFeePerGas,
    maxPriorityFeePerGas,
    nonce: register?.nonce,
    to: register?.to,
    value: toHex(register.value),
  };
  logger.log(`[${actionName}] adding new txn`, newTransaction);
  // @ts-expect-error Since src/redux/data.js is not typed yet, `accountAddress`
  // being a string conflicts with the inferred type of "null" for the second
  // parameter.
  await dispatch(dataAddNewTransaction(newTransaction, ownerAddress));
  return register?.nonce;
};

export default registerENS;
