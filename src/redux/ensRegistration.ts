import { subDays } from 'date-fns';
import { Dispatch } from 'react';
import { AppDispatch, AppGetState } from './store';
import { ENSRegistrations, ENSRegistrationState, Records, RegistrationParameters, TransactionRegistrationParameters } from '@/entities';
import { getLocalENSRegistrations, saveLocalENSRegistrations } from '@/handlers/localstorage/accountLocal';
import { NetworkTypes } from '@/helpers';
import { ENS_RECORDS, REGISTRATION_MODES } from '@/helpers/ens';
import { omitFlatten } from '@/helpers/utilities';

const ENS_REGISTRATION_SET_CHANGED_RECORDS = 'ensRegistration/ENS_REGISTRATION_SET_CHANGED_RECORDS';
const ENS_REGISTRATION_SET_INITIAL_RECORDS = 'ensRegistration/ENS_REGISTRATION_SET_INITIAL_RECORDS';
const ENS_REGISTRATION_UPDATE_DURATION = 'ensRegistration/ENS_REGISTRATION_UPDATE_DURATION';
const ENS_REGISTRATION_UPDATE_RECORDS = 'ensRegistration/ENS_REGISTRATION_UPDATE_RECORDS';
const ENS_REGISTRATION_UPDATE_RECORD_BY_KEY = 'ensRegistration/ENS_REGISTRATION_UPDATE_RECORD_BY_KEY';
const ENS_REGISTRATION_REMOVE_RECORD_BY_KEY = 'ensRegistration/ENS_REGISTRATION_REMOVE_RECORD_BY_KEY';
const ENS_REMOVE_EXPIRED_REGISTRATIONS = 'ensRegistration/ENS_REMOVE_EXPIRED_REGISTRATIONS';
const ENS_CONTINUE_REGISTRATION = 'ensRegistration/ENS_CONTINUE_REGISTRATION';
const ENS_START_REGISTRATION = 'ensRegistration/ENS_START_REGISTRATION';
const ENS_SAVE_COMMIT_REGISTRATION_PARAMETERS = 'ensRegistration/ENS_SAVE_COMMIT_REGISTRATION_PARAMETERS';
const ENS_CLEAR_CURRENT_REGISTRATION_NAME = 'ensRegistration/CLEAR_CURRENT_REGISTRATION_NAME';
const ENS_UPDATE_REGISTRATION_PARAMETERS = 'ensRegistration/ENS_UPDATE_REGISTRATION_PARAMETERS';
const ENS_REMOVE_REGISTRATION_BY_NAME = 'ensRegistration/ENS_REMOVE_REGISTRATION_BY_NAME';
const ENS_LOAD_STATE = 'ensRegistration/ENS_LOAD_STATE';

interface EnsRegistrationSetChangedRecordsAction {
  type: typeof ENS_REGISTRATION_SET_CHANGED_RECORDS;
  payload: ENSRegistrationState;
}

interface EnsRegistrationSetInitialRecordsAction {
  type: typeof ENS_REGISTRATION_SET_INITIAL_RECORDS;
  payload: ENSRegistrationState;
}

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

interface EnsRegistrationRemoveRegistrationByName {
  type: typeof ENS_REMOVE_REGISTRATION_BY_NAME;
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

interface EnsRemoveExpiredRegistrationsAction {
  type: typeof ENS_REMOVE_EXPIRED_REGISTRATIONS;
  payload: { registrations: ENSRegistrations };
}

interface EnsUpdateTransactionRegistrationParameters {
  type: typeof ENS_UPDATE_REGISTRATION_PARAMETERS;
  payload: { registrations: ENSRegistrations };
}

interface EnsClearCurrentRegistrationNameAction {
  type: typeof ENS_CLEAR_CURRENT_REGISTRATION_NAME;
}

export type EnsRegistrationActionTypes =
  | EnsRegistrationSetChangedRecordsAction
  | EnsRegistrationSetInitialRecordsAction
  | EnsRegistrationUpdateDurationAction
  | EnsRegistrationUpdateRecordsAction
  | EnsRegistrationUpdateRecordByKeyAction
  | EnsRegistrationRemoveRecordByKeyAction
  | EnsRegistrationRemoveRegistrationByName
  | EnsRegistrationContinueRegistrationAction
  | EnsRegistrationStartRegistrationAction
  | EnsRegistrationSaveCommitRegistrationParametersAction
  | EnsClearCurrentRegistrationNameAction
  | EnsRegistrationLoadState
  | EnsRemoveExpiredRegistrationsAction
  | EnsUpdateTransactionRegistrationParameters;

// -- Actions ---------------------------------------- //

/**
 * Loads initial state from account local storage.
 */
export const ensRegistrationsLoadState = () => async (dispatch: Dispatch<EnsRegistrationLoadState>, getState: AppGetState) => {
  const { accountAddress, network } = getState().settings;
  try {
    const registrations = await getLocalENSRegistrations(accountAddress, network);
    dispatch({
      payload: { registrations },
      type: ENS_LOAD_STATE,
    });
    // eslint-disable-next-line no-empty
  } catch (error) {}
};

export const startRegistration =
  (name: string, mode: keyof typeof REGISTRATION_MODES) => async (dispatch: AppDispatch, getState: AppGetState) => {
    const {
      ensRegistration: { registrations },
      settings: { accountAddress },
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
          [name]: { ...registration, mode, name },
        },
      },
    };
    dispatch({
      payload: updatedEnsRegistrationManager,
      type: ENS_START_REGISTRATION,
    });
  };

export const continueRegistration = (name: string) => async (dispatch: AppDispatch) => {
  const updatedEnsRegistrationManager = {
    currentRegistrationName: name,
  };
  dispatch({
    payload: updatedEnsRegistrationManager,
    type: ENS_CONTINUE_REGISTRATION,
  });
};

export const removeExpiredRegistrations = () => async (dispatch: AppDispatch, getState: AppGetState) => {
  const {
    ensRegistration: { registrations },
    settings: { accountAddress },
  } = getState();

  const accountRegistrations = registrations?.[accountAddress.toLowerCase()] || [];

  const registrationsArray = Object.values(accountRegistrations);

  const sevenDaysAgoMs = subDays(new Date(), 7).getTime();

  const activeRegistrations = registrationsArray.filter(registration =>
    registration?.commitTransactionConfirmedAt ? registration?.commitTransactionConfirmedAt >= sevenDaysAgoMs : true
  );

  dispatch({
    payload: activeRegistrations,
    type: ENS_REMOVE_EXPIRED_REGISTRATIONS,
  });
};

export const setInitialRecords = (records: Records) => async (dispatch: AppDispatch, getState: AppGetState) => {
  const {
    ensRegistration: { registrations, currentRegistrationName },
    settings: { accountAddress },
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
          initialRecords: records,
          records,
        },
      },
    },
  };
  dispatch({
    payload: updatedEnsRegistrationManagerForAccount,
    type: ENS_REGISTRATION_SET_INITIAL_RECORDS,
  });
};

export const setChangedRecords = (changedRecords: Records) => async (dispatch: AppDispatch, getState: AppGetState) => {
  const {
    ensRegistration: { registrations, currentRegistrationName },
    settings: { accountAddress },
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
          changedRecords,
        },
      },
    },
  };
  dispatch({
    payload: updatedEnsRegistrationManagerForAccount,
    type: ENS_REGISTRATION_SET_CHANGED_RECORDS,
  });
};

export const updateRecords = (records: Records) => async (dispatch: AppDispatch, getState: AppGetState) => {
  const {
    ensRegistration: { registrations, currentRegistrationName },
    settings: { accountAddress },
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

export const updateRecordByKey = (key: string, value: string) => async (dispatch: AppDispatch, getState: AppGetState) => {
  const {
    ensRegistration: { registrations, currentRegistrationName },
    settings: { accountAddress },
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

export const removeRecordByKey = (key: string) => async (dispatch: AppDispatch, getState: AppGetState) => {
  const {
    ensRegistration: { registrations, currentRegistrationName },
    settings: { accountAddress },
  } = getState();

  const lcAccountAddress = accountAddress.toLowerCase();
  const accountRegistrations = registrations?.[lcAccountAddress] || {};
  const registration = accountRegistrations[currentRegistrationName] || {};
  const registrationRecords = registration?.records || {};

  const newRecords = omitFlatten(registrationRecords, key as ENS_RECORDS);

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

export const saveCommitRegistrationParameters =
  (registrationParameters: RegistrationParameters | TransactionRegistrationParameters) =>
  async (dispatch: AppDispatch, getState: AppGetState) => {
    const {
      ensRegistration: { registrations, currentRegistrationName },
      settings: { accountAddress },
    } = getState();
    const registrationName = (registrationParameters as RegistrationParameters)?.name || currentRegistrationName;
    const lcAccountAddress = accountAddress.toLowerCase();
    const accountRegistrations = registrations?.[lcAccountAddress] || {};
    const registration = accountRegistrations[registrationName] || {};
    const updatedEnsRegistrationManager = {
      registrations: {
        ...registrations,
        [lcAccountAddress]: {
          ...accountRegistrations,
          [registrationName]: {
            ...registration,
            ...registrationParameters,
          },
        },
      },
    };

    saveLocalENSRegistrations(updatedEnsRegistrationManager.registrations, accountAddress, NetworkTypes.mainnet);

    dispatch({
      payload: updatedEnsRegistrationManager,
      type: ENS_SAVE_COMMIT_REGISTRATION_PARAMETERS,
    });
  };

export const clearCurrentRegistrationName = () => async (dispatch: AppDispatch) => {
  dispatch({
    type: ENS_CLEAR_CURRENT_REGISTRATION_NAME,
  });
};

export const updateTransactionRegistrationParameters =
  (registrationParameters: TransactionRegistrationParameters) => async (dispatch: AppDispatch, getState: AppGetState) => {
    const {
      ensRegistration: { registrations, currentRegistrationName },
      settings: { accountAddress },
    } = getState();

    const lcAccountAddress = accountAddress.toLowerCase();
    const accountRegistrations = registrations?.[lcAccountAddress] || {};
    const registration = accountRegistrations[currentRegistrationName] || {};
    const updatedEnsRegistrationManager = {
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

    saveLocalENSRegistrations(updatedEnsRegistrationManager.registrations, accountAddress, NetworkTypes.mainnet);

    dispatch({
      payload: updatedEnsRegistrationManager,
      type: ENS_UPDATE_REGISTRATION_PARAMETERS,
    });
  };

export const removeRegistrationByName = (name: string) => async (dispatch: AppDispatch, getState: AppGetState) => {
  const {
    ensRegistration: { registrations },
    settings: { accountAddress },
  } = getState();

  const lcAccountAddress = accountAddress.toLowerCase();
  const accountRegistrations = registrations?.[lcAccountAddress] || {};
  delete accountRegistrations?.[name];
  const updatedEnsRegistrationManager = {
    registrations: {
      ...registrations,
      [lcAccountAddress]: {
        ...accountRegistrations,
      },
    },
  };

  saveLocalENSRegistrations(updatedEnsRegistrationManager.registrations, accountAddress, NetworkTypes.mainnet);

  dispatch({
    payload: updatedEnsRegistrationManager,
    type: ENS_UPDATE_REGISTRATION_PARAMETERS,
  });
};

// -- Reducer ----------------------------------------- //
const INITIAL_STATE: ENSRegistrationState = {
  currentRegistrationName: '',
  registrations: {},
};

export default (state = INITIAL_STATE, action: EnsRegistrationActionTypes): ENSRegistrationState => {
  switch (action.type) {
    case ENS_START_REGISTRATION:
      return {
        ...state,
        ...action.payload,
      };
    case ENS_REGISTRATION_SET_CHANGED_RECORDS:
      return {
        ...state,
        ...action.payload,
      };
    case ENS_REGISTRATION_SET_INITIAL_RECORDS:
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
    case ENS_REMOVE_EXPIRED_REGISTRATIONS:
      return {
        ...state,
        ...action.payload,
      };
    case ENS_SAVE_COMMIT_REGISTRATION_PARAMETERS:
      return {
        ...state,
        ...action.payload,
      };
    case ENS_UPDATE_REGISTRATION_PARAMETERS:
      return {
        ...state,
        ...action.payload,
      };
    case ENS_REMOVE_REGISTRATION_BY_NAME:
      return {
        ...state,
        ...action.payload,
      };
    case ENS_CLEAR_CURRENT_REGISTRATION_NAME:
      return {
        ...state,
        currentRegistrationName: '',
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
