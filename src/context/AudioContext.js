import { createContext } from 'react';

const defaultError = () => {
  throw new Error('Missing AudioContext.');
};

const defaultValue = {
  autoplay: false,
  currentlyPlayingAsset: null,
  currentSound: null,
  fadeTo: defaultError,
  isPlayingAsset: false,
  isPlayingAssetPaused: false,
  pickNextAsset: defaultError,
  pickRandomAsset: defaultError,
  playAsset: defaultError,
  playlist: [],
  stopPlayingAsset: defaultError,
  toggleAutoplay: defaultError,
};

export default createContext(defaultValue);
