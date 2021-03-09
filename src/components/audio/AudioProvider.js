import React, { useCallback, useEffect, useMemo, useState } from 'react';
import isEqual from 'react-fast-compare';
import { Animated } from 'react-native';
import Sound from 'react-native-sound';
import { useDispatch, useSelector } from 'react-redux';
import { useDebounce, useDebouncedCallback } from 'use-debounce';
import AudioContext from '../../context/AudioContext';
import { setAutoplay, setCurrentPlayingAsset } from '../../redux/audio';
import isSupportedUriExtension from '@rainbow-me/helpers/isSupportedUriExtension';
import supportedUriExtensions from '@rainbow-me/helpers/supportedUriExtensions';
import { useAccountAssets, useAudio } from '@rainbow-me/hooks';
import logger from 'logger';

export default function AudioProvider({ category, children }) {
  useEffect(() => {
    Sound.setCategory('Playback');
  }, [category]);

  const buildPlaylistFromCollectibles = useCallback(
    collectibles =>
      collectibles.filter(({ animation_url }) =>
        isSupportedUriExtension(
          animation_url,
          supportedUriExtensions.SUPPORTED_AUDIO_EXTENSIONS
        )
      ),
    []
  );

  const { collectibles } = useAccountAssets();
  const [playlist, setPlaylist] = useState(() =>
    buildPlaylistFromCollectibles(collectibles)
  );

  // Deeply-memoized playlist management. (Avoid reallocation of playlists
  // when the content is effectively identical.)
  useEffect(() => {
    const maybeNextPlaylist = buildPlaylistFromCollectibles(collectibles);
    if (!isEqual(playlist, maybeNextPlaylist)) {
      setPlaylist(maybeNextPlaylist);
    }
  }, [buildPlaylistFromCollectibles, collectibles, setPlaylist, playlist]);

  const [currentSound, setCurrentSound] = useState(null);

  const dispatch = useDispatch();
  const { currentlyPlayingAsset, autoplay } = useSelector(
    ({ audio: { currentlyPlayingAsset, autoplay } }) => ({
      autoplay,
      currentlyPlayingAsset,
    }),
    isEqual
  );

  const pickRandomAsset = useCallback(() => {
    const choices = playlist.filter(e => e !== currentlyPlayingAsset);
    const { length: numberToChoose } = choices;
    return numberToChoose > 0
      ? choices[Math.floor(Math.random() * choices.length)]
      : playlist[0];
  }, [playlist, currentlyPlayingAsset]);
  const pickNextAsset = useCallback(() => {
    const nextIndex =
      (playlist.indexOf(currentlyPlayingAsset) + 1) % playlist.length || 0;
    return playlist[nextIndex];
  }, [playlist, currentlyPlayingAsset]);

  const playAsset = useCallback(
    asset => {
      setCurrentSound(maybeCurrentSound => {
        !!maybeCurrentSound && maybeCurrentSound.setVolume(0);
        return maybeCurrentSound;
      });
      return dispatch(setCurrentPlayingAsset(asset));
    },
    [dispatch, setCurrentSound]
  );

  const stopPlayingAsset = useCallback(
    () => dispatch(setCurrentPlayingAsset(null)),
    [dispatch]
  );

  const isPlayingAsset = !!currentlyPlayingAsset;

  const [isPlayingAssetPaused, setIsPlayingAssetPaused] = useState(false);

  useEffect(() => {
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

  const shouldLoadSoundByUri = useCallback(async uri => {
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

  const fadeTo = useCallback(async (nextSound, toValue = 0) => {
    if (!nextSound) {
      return;
    }

    /* fade out volume */
    const volume = new Animated.Value(nextSound.getVolume());
    volume.addListener(({ value }) => nextSound.setVolume(value));

    return new Promise(resolve =>
      Animated.timing(volume, {
        duration: 1500,
        toValue,
        useNativeDriver: true,
      }).start(resolve)
    );
  }, []);

  // Whilst we're playing, if the playlist (a list of the user's purchased Sound NFTs)
  // changes, check to see if the sound is still available. If it's not, the sound should
  // be dismissed.
  const isCurrentPlayingAssetWithinWallet = useMemo(() => {
    if (currentlyPlayingAsset && typeof currentlyPlayingAsset === 'object') {
      const { uniqueId } = currentlyPlayingAsset;
      if (typeof uniqueId === 'string') {
        return playlist.some(
          ({ uniqueId: currentUniqueId }) => currentUniqueId === uniqueId
        );
      }
    }
    return (
      !!currentlyPlayingAsset && playlist.indexOf(currentlyPlayingAsset) >= 0
    );
  }, [currentlyPlayingAsset, playlist]);

  // Manage fade out when a sound should stop playing.
  useEffect(() => {
    if (
      currentlyPlayingAsset &&
      currentSound &&
      !isCurrentPlayingAssetWithinWallet
    ) {
      // Wait for UI to settle before executing fade.
      setTimeout(() => fadeTo(currentSound, 0).then(stopPlayingAsset), 120);
    }
  }, [
    currentlyPlayingAsset,
    stopPlayingAsset,
    currentSound,
    fadeTo,
    isCurrentPlayingAssetWithinWallet,
  ]);

  const shouldAutoplayNext = useCallback(() => {
    const nextAsset = pickNextAsset();
    return dispatch(setCurrentPlayingAsset(nextAsset));
  }, [pickNextAsset, dispatch]);

  const shouldPlaySound = useCallback(
    async soundToPlay => {
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
              if (autoplay) {
                shouldAutoplayNext();
                return soundInStateOnceFinishedPlaying;
              }
              // Clear the sound in state.
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
    [setCurrentSound, stopPlayingAsset, shouldAutoplayNext, autoplay]
  );

  const setNextSoundAndDestroyLastIfExists = useCallback(
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

  const shouldPlayNextAsset = useCallback(
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

  const [loadingNextAsset, setLoadingNextAsset] = useState(false);

  // redux_sync
  useEffect(() => {
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
  }, [
    isCurrentPlayingAssetWithinWallet,
    setCurrentSound,
    setLoadingNextAsset,
    debouncedShouldPlayNext,
    currentlyPlayingAsset,
    shouldPlayNextAsset,
    setNextSoundAndDestroyLastIfExists,
  ]);

  const toggleAutoplay = useCallback(() => {
    return dispatch(setAutoplay(!autoplay));
  }, [autoplay, dispatch]);

  const parentValue = useAudio();

  const [debouncedPaused] = useDebounce(
    isPlayingAssetPaused && !loadingNextAsset && !!currentlyPlayingAsset,
    45
  );

  const value = useMemo(
    () => ({
      ...parentValue,
      autoplay,
      currentlyPlayingAsset,
      currentSound,
      fadeTo,
      isPlayingAsset,
      isPlayingAssetPaused: debouncedPaused,
      pickNextAsset,
      pickRandomAsset,
      playAsset,
      playlist,
      stopPlayingAsset,
      toggleAutoplay,
    }),
    [
      autoplay,
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
      toggleAutoplay,
      fadeTo,
    ]
  );

  return (
    <AudioContext.Provider value={value}>{children}</AudioContext.Provider>
  );
}
