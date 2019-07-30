import produce from 'immer';
import { omit } from 'lodash';

// // -- Constants --------------------------------------- //
const MERGE = 'imageDimensionsCache/MERGE';
const PRUNE = 'imageDimensionsCache/PRUNE';

export const pruneImageDimensionsCache = idsToPrune => dispatch => dispatch({
  idsToPrune,
  type: PRUNE,
});

export const updateImageDimensionsCache = payload => dispatch => dispatch({
  ...payload,
  type: MERGE,
});

// // -- Reducer ----------------------------------------- //
const INITIAL_STATE = {};

export default (state = INITIAL_STATE, action) => (
  produce(state, draft => {
    switch (action.type) {
    case MERGE:
      draft[action.id] = action.dimensions;
      break;
    case PRUNE:
      omit(draft, action.idsToPrune);
      break;
    default:
      break;
    }
  })
);
