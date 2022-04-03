import { concat } from 'lodash';
import {
  createNewENSAction,
  createNewRap,
  ENSActionParameters,
  RapActionTypes,
  RapENSAction,
} from './common';
import {
  formatRecordsForTransaction,
  recordsForTransactionAreValid,
  shouldUseMulticallTransaction,
} from '@rainbow-me/handlers/ens';

export const createSetRecordsENSRap = async (
  ensActionParameters: ENSActionParameters
) => {
  let actions: RapENSAction[] = [];

  const ensRegistrationRecords = formatRecordsForTransaction(
    ensActionParameters.records
  );
  const validRecords = recordsForTransactionAreValid(ensRegistrationRecords);
  if (validRecords) {
    const shouldUseMulticall = shouldUseMulticallTransaction(
      ensRegistrationRecords
    );
    const recordsAction = createNewENSAction(
      shouldUseMulticall
        ? RapActionTypes.multicallENS
        : RapActionTypes.setTextENS,
      ensActionParameters
    );
    actions = concat(actions, recordsAction);
  }

  // create the overall rap
  const newRap = createNewRap(actions);
  return newRap;
};

export const createRegisterENSRap = async (
  ensActionParameters: ENSActionParameters
) => {
  let actions: RapENSAction[] = [];

  const register = createNewENSAction(
    RapActionTypes.registerWithConfigENS,
    ensActionParameters
  );
  actions = concat(actions, register);

  const ensRegistrationRecords = formatRecordsForTransaction(
    ensActionParameters.records
  );
  const validRecords = recordsForTransactionAreValid(ensRegistrationRecords);
  if (validRecords) {
    const shouldUseMulticall = shouldUseMulticallTransaction(
      ensRegistrationRecords
    );
    const recordsAction = createNewENSAction(
      shouldUseMulticall
        ? RapActionTypes.multicallENS
        : RapActionTypes.setTextENS,
      ensActionParameters
    );
    actions = concat(actions, recordsAction);
  }

  if (ensActionParameters.setReverseRecord) {
    const setName = createNewENSAction(
      RapActionTypes.setNameENS,
      ensActionParameters
    );
    actions = concat(actions, setName);
  }

  // create the overall rap
  const newRap = createNewRap(actions);
  return newRap;
};

export const createRenewENSRap = async (
  ENSActionParameters: ENSActionParameters
) => {
  let actions: RapENSAction[] = [];
  // // commit rap
  const commit = createNewENSAction(
    RapActionTypes.renewENS,
    ENSActionParameters
  );
  actions = concat(actions, commit);

  // create the overall rap
  const newRap = createNewRap(actions);
  return newRap;
};

export const createSetNameENSRap = async (
  ENSActionParameters: ENSActionParameters
) => {
  let actions: RapENSAction[] = [];
  // // commit rap
  const commit = createNewENSAction(
    RapActionTypes.setNameENS,
    ENSActionParameters
  );
  actions = concat(actions, commit);

  // create the overall rap
  const newRap = createNewRap(actions);
  return newRap;
};

export const createCommitENSRap = async (
  ENSActionParameters: ENSActionParameters
) => {
  let actions: RapENSAction[] = [];
  // // commit rap
  const commit = createNewENSAction(
    RapActionTypes.commitENS,
    ENSActionParameters
  );
  actions = concat(actions, commit);

  // create the overall rap
  const newRap = createNewRap(actions);
  return newRap;
};
