import isSupportedUriExtension from '../helpers/isSupportedUriExtension';
import supportedUriExtensions from '../helpers/supportedUriExtensions';

// -- Constants --------------------------------------- //
const AUDIO_RECEIVE_CURRENT_PLAYING_ASSET =
  'audio/AUDIO_RECEIVE_CURRENT_PLAYING_ASSET';

// -- Reducer ----------------------------------------- //
const INITIAL_STATE = {
  currentlyPlayingAsset: null,
};

const receiveCurrentPlayingAsset = payload => ({
  payload,
  type: AUDIO_RECEIVE_CURRENT_PLAYING_ASSET,
});

export const setCurrentPlayingAsset = asset => async dispatch => {
  // Deactivate currentPlayingAsset?
  if (asset === null) {
    return dispatch(receiveCurrentPlayingAsset(asset));
  }

  // Else, the user is attempting to play a new asset or override an existing one.
  // Here we validate to see that it "looks" like how we expect it to.
  if (!asset || typeof asset !== 'object') {
    throw new Error(`Expected object asset, encountered ${asset}.`);
  }
  const { animation_url } = asset;
  if (typeof animation_url !== 'string' || !animation_url.length) {
    throw new Error(
      `Expected non-empty string animation_url, encountered ${animation_url}.`
    );
  }
  if (
    !isSupportedUriExtension(
      animation_url,
      supportedUriExtensions.SUPPORTED_AUDIO_EXTENSIONS
    )
  ) {
    throw new Error(
      `Invalid audio uri extension, expected: ${supportedUriExtensions.SUPPORTED_AUDIO_EXTENSIONS.join(
        ','
      )}. (${animation_url})`
    );
  }
  return dispatch(receiveCurrentPlayingAsset(asset));
};

export default (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case AUDIO_RECEIVE_CURRENT_PLAYING_ASSET:
      return { ...state, currentlyPlayingAsset: action.payload };
    default:
      return state;
  }
};
