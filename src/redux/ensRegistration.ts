import { AnyAction } from 'redux';
import { AppDispatch } from './store';

const ENS_REGISTRATION_UPDATE_NAME =
  'ensRegistration/ENS_REGISTRATION_UPDATE_NAME';
const ENS_REGISTRATION_DUMMY_UPDATE_RECORDS =
  'ensRegistration/ENS_REGISTRATION_DUMMY_UPDATE_RECORDS';
const ENS_REGISTRATION_UPDATE_RECORD =
  'ensRegistration/ENS_REGISTRATION_UPDATE_RECORD';
const ENS_REGISTRATION_UPDATE_RECORDS_ADDRESSES =
  'ensRegistration/ENS_REGISTRATION_UPDATE_ADDRESSES_RECORD';
const ENS_REGISTRATION_UPDATE_RECORDS_CONTENT =
  'ensRegistration/ENS_REGISTRATION_UPDATE_RECORDS_CONTENT';
const ENS_REGISTRATION_UPDATE_RECORDS_TEXT =
  'ensRegistration/ENS_REGISTRATION_UPDATE_RECORDS_TEXT';

enum RECORD_KEYS {
  ADDRESSES_KEY,
  CONTENT_KEY,
  TEXT_KEY,
}
// -- Actions ---------------------------------------- //

interface Records {
  [key: string]: string;
}

interface ChartsState {
  name: string;
  records: {
    [RECORD_KEYS.ADDRESSES_KEY]: Records;
    [RECORD_KEYS.CONTENT_KEY]: Records;
    [RECORD_KEYS.TEXT_KEY]: Records;
  };
}

export const ensRegistrationUpdateName = (name: string) => async (
  dispatch: AppDispatch
) =>
  dispatch({
    payload: name,
    type: ENS_REGISTRATION_UPDATE_NAME,
  });

export const ensRegistrationUpdateRecords = (records: Records) => async (
  dispatch: AppDispatch
) =>
  dispatch({
    payload: records,
    type: ENS_REGISTRATION_DUMMY_UPDATE_RECORDS,
  });

export const ensRegistrationUpdateRecord = (
  key: string,
  value: string
) => async (dispatch: AppDispatch) =>
  dispatch({
    payload: { key, value },
    type: ENS_REGISTRATION_UPDATE_RECORD,
  });

// -- Reducer ----------------------------------------- //
const INITIAL_STATE: ChartsState = {
  name: '',
  records: {
    [RECORD_KEYS.ADDRESSES_KEY]: {} as Records,
    [RECORD_KEYS.CONTENT_KEY]: {} as Records,
    [RECORD_KEYS.TEXT_KEY]: {} as Records,
  },
};

export default (state = INITIAL_STATE, action: AnyAction) => {
  switch (action.type) {
    case ENS_REGISTRATION_DUMMY_UPDATE_RECORDS:
      return {
        ...state,
        records: action.payload,
      };
    case ENS_REGISTRATION_UPDATE_NAME:
      return {
        ...state,
        name: action.payload,
      };
    case ENS_REGISTRATION_UPDATE_RECORDS_ADDRESSES: {
      return {
        ...state,
        records: {
          ...state.records,
          [RECORD_KEYS.ADDRESSES_KEY]: action.payload,
        },
      };
    }
    case ENS_REGISTRATION_UPDATE_RECORDS_CONTENT: {
      return {
        ...state,
        records: {
          ...state.records,
          [RECORD_KEYS.CONTENT_KEY]: action.payload,
        },
      };
    }
    case ENS_REGISTRATION_UPDATE_RECORDS_TEXT: {
      return {
        ...state,
        records: {
          ...state.records,
          [RECORD_KEYS.TEXT_KEY]: action.payload,
        },
      };
    }
    case ENS_REGISTRATION_UPDATE_RECORD: {
      const { key, value } = action.payload;
      return {
        ...state,
        records: {
          ...state.records,
          [key]: value,
        },
      };
    }
    default:
      return state;
  }
};
