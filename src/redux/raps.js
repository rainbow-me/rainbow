import { omit } from 'lodash';
import { getRaps, saveRaps } from '../handlers/localstorage/raps';

// -- Constants --------------------------------------- //
const RAPS_UPDATE = 'raps/RAPS_UPDATE';
const RAPS_LOAD = 'raps/RAPS_LOAD';
const RAPS_CLEAR_STATE = 'raps/RAPS_CLEAR_STATE';

// -- Actions ---------------------------------------- //
export const rapsLoadState = () => async dispatch => {
  try {
    const raps = await getRaps();
    dispatch({
      payload: raps,
      type: RAPS_LOAD,
    });
    // eslint-disable-next-line no-empty
  } catch (error) {}
};

export const rapsAddOrUpdate = (id, data) => (dispatch, getState) => {
  const { raps } = getState().raps;
  const updatedRaps = {
    ...raps,
    [id]: data,
  };
  saveRaps(updatedRaps);
  dispatch({
    payload: updatedRaps,
    type: RAPS_UPDATE,
  });
};

export const rapsRemove = id => (dispatch, getState) => {
  const { raps } = getState().raps;
  const updatedraps = id ? omit(raps, id) : {};
  saveRaps(updatedraps);
  dispatch({
    payload: updatedraps,
    type: RAPS_UPDATE,
  });
};

// -- Reducer ----------------------------------------- //
const INITIAL_STATE = {
  raps: {},
};

export default (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case RAPS_UPDATE:
      return { ...state, raps: action.payload };
    case RAPS_LOAD:
      return {
        ...state,
        raps: action.payload,
      };
    case RAPS_CLEAR_STATE:
      return {
        ...state,
        ...INITIAL_STATE,
      };
    default:
      return state;
  }
};
