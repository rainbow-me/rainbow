import produce from 'immer';
import { Dispatch } from 'redux';
import { getImageMetadata, saveImageMetadata } from '@/handlers/localstorage/globalSettings';
import { AppGetState } from '@/redux/store';

// -- Constants --------------------------------------- //
const CLEAR = 'imageMetadata/CLEAR';
const LOAD = 'imageMetadata/LOAD';
const MERGE = 'imageMetadata/MERGE';

// -- Types ------------------------------------------ //

/**
 * Represents cached metadata for an image.
 */
export interface ImageMetadata {
  color?: string;
  dimensions: {
    height: number;
    isSquare: boolean;
    width: number;
  };
}

/**
 * The state of the `imageMetadata` reducer.
 */
interface ImageMetadataState {
  imageMetadata: {
    [id: string]: ImageMetadata;
  };
}

/**
 * An `imageMetadata` Redux action.
 */
type ImageMetadataAction = ImageMetadataLoadAction | ImageMetadataMergeAction | ImageMetadataClearAction;

interface ImageMetadataLoadAction {
  type: typeof LOAD;
  payload: ImageMetadataState['imageMetadata'];
}

interface ImageMetadataMergeAction {
  type: typeof MERGE;
  id: string;
  metadata: ImageMetadata;
}

interface ImageMetadataClearAction {
  type: typeof CLEAR;
}

interface UpdateImageMetadataFunctionParameter {
  id: string;
  metadata: ImageMetadata;
}

// -- Actions ---------------------------------------- //
export const clearImageMetadataCache = () => (dispatch: Dispatch<ImageMetadataClearAction>) => dispatch({ type: CLEAR });

export const imageMetadataCacheLoadState = () => async (dispatch: Dispatch<ImageMetadataLoadAction>) => {
  const metadataCache = await getImageMetadata();
  dispatch({
    payload: metadataCache,
    type: LOAD,
  });
};

export const updateImageMetadataCache =
  ({ id, metadata }: UpdateImageMetadataFunctionParameter) =>
  (dispatch: Dispatch<ImageMetadataMergeAction>, getState: AppGetState) => {
    const { imageMetadata } = getState().imageMetadata;
    dispatch({ id, metadata, type: MERGE });
    saveImageMetadata({
      ...imageMetadata,
      [id]: metadata,
    });
  };

// -- Reducer ----------------------------------------- //
const INITIAL_STATE: ImageMetadataState = {
  imageMetadata: {},
};

export default (state: ImageMetadataState = INITIAL_STATE, action: ImageMetadataAction) =>
  produce(state, draft => {
    if (action.type === LOAD) {
      draft.imageMetadata = action.payload;
    } else if (action.type === MERGE) {
      draft.imageMetadata[action?.id] = action.metadata;
    } else if (action.type === CLEAR) {
      return INITIAL_STATE;
    }
  });
