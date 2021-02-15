import * as React from 'react';

const defaultErrorThunk = () => async () => {
  throw new Error(
    "It looks like you've forgotten to declare an AudioContextProvider at the root of your application."
  );
};

const defaultValue = Object.freeze({
  autoplay: false,
  currentlyPlayingAsset: null,
  currentSound: null,
  fadeTo: defaultErrorThunk(),
  isPlayingAsset: false,
  isPlayingAssetPaused: false,
  pickNextAsset: defaultErrorThunk(),
  pickRandomAsset: defaultErrorThunk(),
  playAsset: defaultErrorThunk(),
  playlist: [],
  stopPlayingAsset: defaultErrorThunk(),
  toggleAutoplay: defaultErrorThunk(),
});

export default React.createContext(defaultValue);
