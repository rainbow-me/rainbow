import produce from 'immer';
import {
  getImageMetadata,
  saveImageMetadata,
} from '../handlers/localstorage/globalSettings';

// // -- Constants --------------------------------------- //
const MERGE = 'imageMetadata/MERGE';

export const imageMetadataCacheLoadState = () => async dispatch => {
  const metadataCache = await getImageMetadata();
  dispatch({
    payload: metadataCache,
    type: MERGE,
  });
};

export const updateImageMetadataCache = ({ id, metadata }) => (
  dispatch,
  getState
) => {
  const { imageMetadata } = getState();
  dispatch({ id, metadata, type: MERGE });
  saveImageMetadata({
    ...imageMetadata,
    [id]: metadata,
  });
};

// // -- Reducer ----------------------------------------- //
const INITIAL_STATE = {};

export default (state = INITIAL_STATE, action) =>
  produce(state, draft => {
    switch (action.type) {
      case MERGE:
        draft[action.id] = action.metadata;
        break;
      default:
        break;
    }
  });
