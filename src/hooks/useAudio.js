import * as React from 'react';
import isEqual from 'react-fast-compare';
import { useDispatch, useSelector } from 'react-redux';
import { setCurrentPlayingAsset } from '../redux/audio';

export default function useAudio() {
  const dispatch = useDispatch();
  const { currentlyPlayingAsset } = useSelector(
    ({ audio: { currentlyPlayingAsset } }) => ({
      currentlyPlayingAsset,
    }),
    isEqual
  );

  const playAsset = React.useCallback(
    asset => dispatch(setCurrentPlayingAsset(asset)),
    [dispatch]
  );

  const stopPlayingAsset = React.useCallback(
    () => dispatch(setCurrentPlayingAsset(null)),
    [dispatch]
  );

  const isPlayingAsset = !!currentlyPlayingAsset;

  return { currentlyPlayingAsset, isPlayingAsset, playAsset, stopPlayingAsset };
}
