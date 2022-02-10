import { captureException } from '@sentry/react-native';
import { RapActionParameters, SetTextENSActionParameters } from '../common';
import { estimateENSSetTextGasLimit } from '@rainbow-me/handlers/ens';
import { toHex } from '@rainbow-me/handlers/web3';
import {
  ENSRegistrationTransactionType,
  getENSExecutionDetails,
} from '@rainbow-me/helpers/ens';
import { dataAddNewTransaction } from '@rainbow-me/redux/data';
import store from '@rainbow-me/redux/store';
import logger from 'logger';

const executeSetText = async (
  name: string,
  recordKey: string,
  recordValue: string,
  gasLimit: string | null,
  maxFeePerGas: string,
  maxPriorityFeePerGas: string,
  nonce: number | null = null
) => {
  const { contract, methodArguments, value } = await getENSExecutionDetails({
    name,
    records: {
      coinAddress: null,
      contentHash: null,
      ensAssociatedAddress: null,
      text: [
        {
          key: recordKey,
          value: recordValue,
        },
      ],
    },
    type: ENSRegistrationTransactionType.SET_TEXT,
  });

  return contract?.setText(methodArguments, {
    gasLimit: gasLimit ? toHex(gasLimit) : undefined,
    maxFeePerGas: toHex(maxFeePerGas) || undefined,
    maxPriorityFeePerGas: toHex(maxPriorityFeePerGas) || undefined,
    nonce: nonce ? toHex(nonce) : undefined,
    ...(value ? { value } : {}),
  });
};

const actionName = 'setTextENS';

const setTextENS = async (
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
    recordKey,
    recordValue,
  } = parameters as SetTextENSActionParameters;

  logger.log(`[${actionName}] rap for`, name);

  let gasLimit;
  try {
    logger.sentry(`[${actionName}] estimate gas`, {
      name,
      recordKey,
      recordValue,
    });
    gasLimit = await estimateENSSetTextGasLimit(name, recordKey, recordValue);
  } catch (e) {
    logger.sentry(`[${actionName}] Error estimating gas`);
    captureException(e);
    throw e;
  }
  let setText;
  let maxFeePerGas;
  let maxPriorityFeePerGas;
  try {
    let maxFeePerGas = selectedGasFee?.gasFeeParams?.maxFeePerGas?.amount;
    let maxPriorityFeePerGas =
      selectedGasFee?.gasFeeParams?.maxPriorityFeePerGas?.amount;

    logger.sentry(`[${actionName}] about to execute`, {
      name,
      recordKey,
      recordValue,
    });
    const nonce = baseNonce ? baseNonce + index : null;

    setText = await executeSetText(
      name,
      recordKey,
      recordValue,
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

  logger.log(`[${actionName}] response`, setText);

  const newTransaction = {
    amount: 0,
    data: setText.data,
    from: ownerAddress,
    gasLimit,
    hash: setText?.hash,
    maxFeePerGas,
    maxPriorityFeePerGas,
    nonce: setText?.nonce,
    to: setText?.to,
    value: toHex(setText.value),
  };
  logger.log(`[${actionName}] adding new txn`, newTransaction);
  // @ts-expect-error Since src/redux/data.js is not typed yet, `accountAddress`
  // being a string conflicts with the inferred type of "null" for the second
  // parameter.
  await dispatch(dataAddNewTransaction(newTransaction, ownerAddress));
  return setText?.nonce;
};

export default setTextENS;
