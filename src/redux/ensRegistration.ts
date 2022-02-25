import { omit } from 'lodash';
import { Dispatch } from 'react';
import { AppDispatch, AppGetState } from './store';
import {
  CommitRegistrationParameters,
  ENSRegistrations,
  ENSRegistrationState,
  EthereumAddress,
  Records,
  RegistrationParameters,
} from '@rainbow-me/entities';
import {
  getLocalENSRegistrations,
  saveLocalENSRegistrations,
} from '@rainbow-me/handlers/localstorage/accountLocal';
import { NetworkTypes } from '@rainbow-me/helpers';

const ENS_REGISTRATION_UPDATE_DURATION =
  'ensRegistration/ENS_REGISTRATION_UPDATE_DURATION';
const ENS_REGISTRATION_UPDATE_RECORDS =
  'ensRegistration/ENS_REGISTRATION_UPDATE_RECORDS';
const ENS_REGISTRATION_UPDATE_RECORD_BY_KEY =
  'ensRegistration/ENS_REGISTRATION_UPDATE_RECORD_BY_KEY';
const ENS_REGISTRATION_REMOVE_RECORD_BY_KEY =
  'ensRegistration/ENS_REGISTRATION_REMOVE_RECORD_BY_KEY';
const ENS_CONTINUE_REGISTRATION = 'ensRegistration/ENS_CONTINUE_REGISTRATION';
const ENS_START_REGISTRATION = 'ensRegistration/ENS_START_REGISTRATION';
const ENS_SAVE_COMMIT_REGISTRATION_PARAMETERS =
  'ensRegistration/ENS_SAVE_COMMIT_REGISTRATION_PARAMETERS';
const ENS_LOAD_STATE = 'ensRegistration/ENS_LOAD_STATE';

interface EnsRegistrationUpdateDurationAction {
  type: typeof ENS_REGISTRATION_UPDATE_DURATION;
  payload: { registrations: ENSRegistrations };
}

interface EnsRegistrationUpdateRecordsAction {
  type: typeof ENS_REGISTRATION_UPDATE_RECORDS;
  payload: { registrations: ENSRegistrations };
}

interface EnsRegistrationUpdateRecordByKeyAction {
  type: typeof ENS_REGISTRATION_UPDATE_RECORD_BY_KEY;
  payload: { registrations: ENSRegistrations };
}

interface EnsRegistrationRemoveRecordByKeyAction {
  type: typeof ENS_REGISTRATION_REMOVE_RECORD_BY_KEY;
  payload: { registrations: ENSRegistrations };
}

interface EnsRegistrationContinueRegistrationAction {
  type: typeof ENS_CONTINUE_REGISTRATION;
  payload: { registrations: ENSRegistrations };
}

interface EnsRegistrationStartRegistrationAction {
  type: typeof ENS_START_REGISTRATION;
  payload: ENSRegistrationState;
}

interface EnsRegistrationSaveCommitRegistrationParametersAction {
  type: typeof ENS_SAVE_COMMIT_REGISTRATION_PARAMETERS;
  payload: { registrations: ENSRegistrations };
}

interface EnsRegistrationLoadState {
  type: typeof ENS_LOAD_STATE;
  payload: { registrations: ENSRegistrations };
}

export type EnsRegistrationActionTypes =
  | EnsRegistrationUpdateDurationAction
  | EnsRegistrationUpdateRecordsAction
  | EnsRegistrationUpdateRecordByKeyAction
  | EnsRegistrationRemoveRecordByKeyAction
  | EnsRegistrationContinueRegistrationAction
  | EnsRegistrationStartRegistrationAction
  | EnsRegistrationSaveCommitRegistrationParametersAction
  | EnsRegistrationLoadState;

// -- Actions ---------------------------------------- //

/**
 * Loads initial state from account local storage.
 */
export const ensRegistrationsLoadState = () => async (
  dispatch: Dispatch<EnsRegistrationLoadState>,
  getState: AppGetState
) => {
  const { accountAddress, network } = getState().settings;
  try {
    const registrations = await getLocalENSRegistrations(
      accountAddress,
      network
    );
    dispatch({
      payload: { registrations },
      type: ENS_LOAD_STATE,
    });
    // eslint-disable-next-line no-empty
  } catch (error) {}
};

export const startRegistration = (
  accountAddress: EthereumAddress,
  name: string
) => async (dispatch: AppDispatch, getState: AppGetState) => {
  const {
    ensRegistration: { registrations },
  } = getState();

  const lcAccountAddress = accountAddress.toLowerCase();
  const accountRegistrations = registrations?.[lcAccountAddress] || {};
  const registration = accountRegistrations[name] || {};

  const updatedEnsRegistrationManager = {
    currentRegistrationName: name,
    registrations: {
      ...registrations,
      [lcAccountAddress]: {
        ...accountRegistrations,
        [name]: { ...registration, name },
      },
    },
  };
  dispatch({
    payload: updatedEnsRegistrationManager,
    type: ENS_START_REGISTRATION,
  });
};

export const continueRegistration = (name: string) => async (
  dispatch: AppDispatch
) => {
  const updatedEnsRegistrationManager = {
    currentRegistrationName: name,
  };
  dispatch({
    payload: updatedEnsRegistrationManager,
    type: ENS_CONTINUE_REGISTRATION,
  });
};

export const updateRegistrationDuration = (
  accountAddress: EthereumAddress,
  duration: number
) => async (dispatch: AppDispatch, getState: AppGetState) => {
  const {
    ensRegistration: { registrations, currentRegistrationName },
  } = getState();
  const lcAccountAddress = accountAddress.toLowerCase();

  const accountRegistrations = registrations?.[lcAccountAddress] || {};
  const registration = accountRegistrations[currentRegistrationName] || {};

  const updatedEnsRegistrationManager = {
    registrations: {
      ...registrations,
      [lcAccountAddress]: {
        ...accountRegistrations,
        [currentRegistrationName]: { ...registration, duration },
      },
    },
  };
  dispatch({
    payload: updatedEnsRegistrationManager,
    type: ENS_REGISTRATION_UPDATE_DURATION,
  });
};

export const updateRecords = (
  accountAddress: EthereumAddress,
  records: Records
) => async (dispatch: AppDispatch, getState: AppGetState) => {
  const {
    ensRegistration: { registrations, currentRegistrationName },
  } = getState();
  const lcAccountAddress = accountAddress.toLowerCase();
  const accountRegistrations = registrations?.[lcAccountAddress] || {};
  const registration = accountRegistrations[currentRegistrationName] || {};

  const updatedEnsRegistrationManagerForAccount = {
    registrations: {
      ...registrations,
      [lcAccountAddress]: {
        ...accountRegistrations,
        [currentRegistrationName]: { ...registration, records },
      },
    },
  };
  dispatch({
    payload: updatedEnsRegistrationManagerForAccount,
    type: ENS_REGISTRATION_UPDATE_RECORDS,
  });
};

export const updateRecordByKey = (
  accountAddress: EthereumAddress,
  key: string,
  value: string
) => async (dispatch: AppDispatch, getState: AppGetState) => {
  const {
    ensRegistration: { registrations, currentRegistrationName },
  } = getState();
  const lcAccountAddress = accountAddress.toLowerCase();

  const accountRegistrations = registrations?.[lcAccountAddress] || {};
  const registration = accountRegistrations[currentRegistrationName] || {};
  const registrationRecords = registration?.records || {};

  const updatedEnsRegistrationManagerForAccount = {
    registrations: {
      ...registrations,
      [lcAccountAddress]: {
        ...accountRegistrations,
        [currentRegistrationName]: {
          ...registration,
          records: { ...registrationRecords, [key]: value },
        },
      },
    },
  };
  dispatch({
    payload: updatedEnsRegistrationManagerForAccount,
    type: ENS_REGISTRATION_UPDATE_RECORDS,
  });
};

export const removeRecordByKey = (
  accountAddress: EthereumAddress,
  key: string
) => async (dispatch: AppDispatch, getState: AppGetState) => {
  const {
    ensRegistration: { registrations, currentRegistrationName },
  } = getState();

  const lcAccountAddress = accountAddress.toLowerCase();
  const accountRegistrations = registrations?.[lcAccountAddress] || {};
  const registration = accountRegistrations[currentRegistrationName] || {};
  const registrationRecords = registration?.records || {};

  const newRecords = omit(registrationRecords, key) as Records;

  const updatedEnsRegistrationManagerForAccount = {
    registrations: {
      ...registrations,
      [lcAccountAddress]: {
        ...accountRegistrations,
        [currentRegistrationName]: {
          ...registration,
          records: newRecords,
        },
      },
    },
  };

  dispatch({
    payload: updatedEnsRegistrationManagerForAccount,
    type: ENS_REGISTRATION_REMOVE_RECORD_BY_KEY,
  });
};

export const saveCommitRegistrationParameters = (
  accountAddress: EthereumAddress,
  registrationParameters: RegistrationParameters
) => async (dispatch: AppDispatch, getState: AppGetState) => {
  const {
    ensRegistration: { registrations, currentRegistrationName },
  } = getState();

  const lcAccountAddress = accountAddress.toLowerCase();
  const accountRegistrations = registrations?.[lcAccountAddress] || {};
  const registration = accountRegistrations[currentRegistrationName] || {};
  const updatedEnsRegistrationManagerForAccount = {
    registrations: {
      ...registrations,
      [lcAccountAddress]: {
        ...accountRegistrations,
        [currentRegistrationName]: {
          ...registration,
          ...registrationParameters,
        },
      },
    },
  };

  saveLocalENSRegistrations(
    updatedEnsRegistrationManagerForAccount.registrations,
    accountAddress,
    NetworkTypes.mainnet
  );

  dispatch({
    payload: updatedEnsRegistrationManagerForAccount,
    type: ENS_SAVE_COMMIT_REGISTRATION_PARAMETERS,
  });
};

export const updateCommitRegistrationParameters = (
  accountAddress: EthereumAddress,
  registrationParameters: CommitRegistrationParameters
) => async (dispatch: AppDispatch, getState: AppGetState) => {
  const {
    ensRegistration: { registrations, currentRegistrationName },
  } = getState();

  const lcAccountAddress = accountAddress.toLowerCase();
  const accountRegistrations = registrations?.[lcAccountAddress] || {};
  const registration = accountRegistrations[currentRegistrationName] || {};
  const updatedEnsRegistrationManagerForAccount = {
    registrations: {
      ...registrations,
      [lcAccountAddress]: {
        ...accountRegistrations,
        [currentRegistrationName]: {
          ...registration,
          ...registrationParameters,
        },
      },
    },
  };

  saveLocalENSRegistrations(
    updatedEnsRegistrationManagerForAccount.registrations,
    accountAddress,
    NetworkTypes.mainnet
  );

  dispatch({
    payload: updatedEnsRegistrationManagerForAccount,
    type: ENS_SAVE_COMMIT_REGISTRATION_PARAMETERS,
  });
};

// -- Reducer ----------------------------------------- //
const INITIAL_STATE: ENSRegistrationState = {
  currentRegistrationName: '',
  registrations: {},
};

export default (
  state = INITIAL_STATE,
  action: EnsRegistrationActionTypes
): ENSRegistrationState => {
  switch (action.type) {
    case ENS_START_REGISTRATION:
      return {
        ...state,
        ...action.payload,
      };
    case ENS_REGISTRATION_UPDATE_DURATION:
      return {
        ...state,
        ...action.payload,
      };
    case ENS_REGISTRATION_UPDATE_RECORDS:
      return {
        ...state,
        ...action.payload,
      };
    case ENS_REGISTRATION_UPDATE_RECORD_BY_KEY:
      return {
        ...state,
        ...action.payload,
      };
    case ENS_REGISTRATION_REMOVE_RECORD_BY_KEY:
      return {
        ...state,
        ...action.payload,
      };
    case ENS_SAVE_COMMIT_REGISTRATION_PARAMETERS:
      return {
        ...state,
        ...action.payload,
      };
    case ENS_LOAD_STATE:
      return {
        ...state,
        ...action.payload,
      };
    default:
      return state;
  }
};
