import { omit } from 'lodash';

// -- Constants --------------------------------------- //
const RAPS_UPDATE = 'raps/RAPS_UPDATE';

// -- Actions ---------------------------------------- //
export const rapsAddOrUpdate = (id, data) => (dispatch, getState) => {
  const { raps } = getState().raps;
  const updatedRaps = {
    ...raps,
    [id]: omit(data, ['callback']),
  };
  dispatch({
    payload: updatedRaps,
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
    default:
      return state;
  }
};
