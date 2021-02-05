import * as React from 'react';
import isEqual from 'react-fast-compare';
import Sound from 'react-native-sound';
import { useDispatch, useSelector } from 'react-redux';
import { useDebounce, useDebouncedCallback } from 'use-debounce';
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

  const pickRandomAsset = React.useCallback(() => {
    const choices = playlist.filter(e => e !== currentlyPlayingAsset);
    const { length: numberToChoose } = choices;
    return numberToChoose > 0
      ? choices[Math.floor(Math.random() * choices.length)]
      : playlist[0];
  }, [playlist, currentlyPlayingAsset]);
  const pickNextAsset = React.useCallback(() => {
    const nextIndex =
      (playlist.indexOf(currentlyPlayingAsset) + 1) % playlist.length || 0;
    return playlist[nextIndex];
  }, [playlist, currentlyPlayingAsset]);

  const playAsset = React.useCallback(
    asset => {
      // Suppress the current sound before playing the next one.
      !!currentSound && currentSound.setVolume(0);
      return dispatch(setCurrentPlayingAsset(asset));
    },
    [dispatch, currentSound]
  );

  const stopPlayingAsset = React.useCallback(
    () => dispatch(setCurrentPlayingAsset(null)),
    [dispatch]
  );

  const isPlayingAsset = !!currentlyPlayingAsset;

  const [isPlayingAssetPaused, setIsPlayingAssetPaused] = React.useState(false);

  React.useEffect(() => {
    const i = setInterval(() => {
      const nextIsPlayingAssetPaused =
        !!currentSound && currentlyPlayingAsset && !currentSound._playing;
      if (nextIsPlayingAssetPaused !== isPlayingAssetPaused) {
        setIsPlayingAssetPaused(nextIsPlayingAssetPaused);
      }
    }, 10);
    return () => clearInterval(i);
  }, [
    currentSound,
    setIsPlayingAssetPaused,
    currentlyPlayingAsset,
    isPlayingAssetPaused,
  ]);

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
        if (nextSoundToPlay) {
          shouldPlaySound(nextSoundToPlay);
        }
        if (maybeCurrentSound) {
          maybeCurrentSound.stop();
          maybeCurrentSound.release();
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

  // Manages the transition between songs. 🎵
  // This is computationally expensive to call, so we must
  // account for the user aggressively selecting tracks.
  const { callback: debouncedShouldPlayNext } = useDebouncedCallback(
    async (
      currentlyPlayingAsset,
      shouldPlayNextAsset,
      setNextSoundAndDestroyLastIfExists,
      setLoadingNextAsset
    ) => {
      if (currentlyPlayingAsset) {
        await shouldPlayNextAsset(currentlyPlayingAsset);
      } else {
        await setNextSoundAndDestroyLastIfExists(null);
      }
      setLoadingNextAsset(false);
    },
    500
  );

  const [loadingNextAsset, setLoadingNextAsset] = React.useState(false);

  // redux_sync
  React.useEffect(() => {
    (async () => {
      try {
        setLoadingNextAsset(true);
        setCurrentSound(maybeCurrentSound => {
          !!maybeCurrentSound && maybeCurrentSound.stop();
          return maybeCurrentSound;
        });
        debouncedShouldPlayNext(
          currentlyPlayingAsset,
          shouldPlayNextAsset,
          setNextSoundAndDestroyLastIfExists,
          setLoadingNextAsset
        );
      } catch (e) {
        logger.error(e);
      }
    })();
  }, [
    setCurrentSound,
    setLoadingNextAsset,
    debouncedShouldPlayNext,
    currentlyPlayingAsset,
    shouldPlayNextAsset,
    setNextSoundAndDestroyLastIfExists,
  ]);

  const parentValue = useAudio();

  const [debouncedPaused] = useDebounce(
    isPlayingAssetPaused && !loadingNextAsset && !!currentlyPlayingAsset,
    45
  );

  const value = React.useMemo(
    () => ({
      ...parentValue,
      currentlyPlayingAsset,
      currentSound,
      isPlayingAsset,
      isPlayingAssetPaused: debouncedPaused,
      pickNextAsset,
      pickRandomAsset,
      playAsset,
      playlist,
      stopPlayingAsset,
    }),
    [
      currentlyPlayingAsset,
      currentSound,
      isPlayingAsset,
      debouncedPaused,
      playAsset,
      stopPlayingAsset,
      pickNextAsset,
      pickRandomAsset,
      parentValue,
      playlist,
    ]
  );

  return (
    <AudioContext.Provider value={value}>{children}</AudioContext.Provider>
  );
}
