import * as React from 'react';
import isEqual from 'react-fast-compare';
import Sound from 'react-native-sound';
import { useDispatch, useSelector } from 'react-redux';
import AudioContext from '../../context/AudioContext';
import isSupportedUriExtension from '../../helpers/isSupportedUriExtension';
import supportedUriExtensions from '../../helpers/supportedUriExtensions';
import { setCurrentPlayingAsset } from '../../redux/audio';
import { useAccountAssets, useAudio } from '@rainbow-me/hooks';
import logger from 'logger';

export default function AudioContextProvider({ category, children }) {
  React.useEffect(() => {
    Sound.setCategory('Playback');
  }, [category]);

  const { collectibles } = useAccountAssets();

  const playlist = React.useMemo(() => {
    return collectibles.filter(({ animation_url }) =>
      isSupportedUriExtension(
        animation_url,
        supportedUriExtensions.SUPPORTED_AUDIO_EXTENSIONS
      )
    );
  }, [collectibles]);

  const [currentSound, setCurrentSound] = React.useState(null);

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

  const shouldLoadSoundByUri = React.useCallback(async uri => {
    const sound = await new Promise((resolve, reject) => {
      const loadedSound = new Sound(uri, null, err => {
        if (err) {
          return reject(err);
        }
        return resolve(loadedSound);
      });
    });
    return sound;
  }, []);

  const shouldPlaySound = React.useCallback(
    async soundToPlay => {
      if (!soundToPlay || typeof soundToPlay !== 'object') {
        throw new Error(
          `Expected object soundToPlay, encountered ${soundToPlay}.`
        );
      }
      if (typeof soundToPlay.play !== 'function') {
        throw new Error(`soundToPlay did not implement a play() method.`);
      }
      return new Promise((resolve, reject) => {
        soundToPlay.play(didFinishSuccessfully => {
          if (!didFinishSuccessfully) {
            return reject(new Error(`Failed to play sound.`));
          }
          setCurrentSound(soundInStateOnceFinishedPlaying => {
            // Check if once we've finished, the sound the AudioManager is managing
            // corresponds to this instance.
            if (soundInStateOnceFinishedPlaying === soundToPlay) {
              // Cancel the state in redux.
              stopPlayingAsset();
              // Clear the sound from memory.
              soundToPlay.release();
              // Also cancel the redux action.
              return null;
            }
            return soundInStateOnceFinishedPlaying;
          });
          // Once finishing playing, if the sound hasn't been overwritten
          // in state then we'll unset the sound ourselves.
          return resolve();
        });
      });
    },
    [setCurrentSound, stopPlayingAsset]
  );

  const setNextSoundAndDestroyLastIfExists = React.useCallback(
    nextSoundToPlay => {
      setCurrentSound(maybeCurrentSound => {
        if (maybeCurrentSound) {
          maybeCurrentSound.stop();
          maybeCurrentSound.release();
        }
        if (nextSoundToPlay) {
          shouldPlaySound(nextSoundToPlay);
        }
        return nextSoundToPlay;
      });
    },
    [setCurrentSound, shouldPlaySound]
  );

  const shouldPlayNextAsset = React.useCallback(
    async nextAsset => {
      try {
        if (!nextAsset || typeof nextAsset !== 'object') {
          throw new Error(
            `Expected object nextAsset, encountered ${nextAsset}.`
          );
        }
        const { animation_url } = nextAsset;
        if (typeof animation_url !== 'string' || !animation_url.length) {
          throw new Error(
            `Expected non-empty string animation_url, encountered ${animation_url}.`
          );
        }
        const nextSound = await shouldLoadSoundByUri(animation_url);
        setNextSoundAndDestroyLastIfExists(nextSound);
      } catch (e) {
        logger.error(e);
      }
    },
    [shouldLoadSoundByUri, setNextSoundAndDestroyLastIfExists]
  );

  React.useEffect(() => {
    if (currentlyPlayingAsset) {
      shouldPlayNextAsset(currentlyPlayingAsset);
    } else {
      setNextSoundAndDestroyLastIfExists(null);
    }
  }, [
    currentlyPlayingAsset,
    setNextSoundAndDestroyLastIfExists,
    shouldPlayNextAsset,
  ]);

  const parentValue = useAudio();

  const value = React.useMemo(
    () => ({
      ...parentValue,
      currentlyPlayingAsset,
      currentSound,
      isPlayingAsset,
      playAsset,
      playlist,
      stopPlayingAsset,
    }),
    [
      currentlyPlayingAsset,
      currentSound,
      isPlayingAsset,
      playAsset,
      stopPlayingAsset,
      parentValue,
      playlist,
    ]
  );

  return (
    <AudioContext.Provider value={value}>{children}</AudioContext.Provider>
  );
}
