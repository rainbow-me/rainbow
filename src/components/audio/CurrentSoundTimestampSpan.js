import * as React from 'react';
import { useAudio } from '@rainbow-me/hooks';

const DEFAULT_TIMESTAMP = '00:00';

function formatTime(currentTime) {
  const hours = Math.floor(currentTime / (60 * 60));
  const minutes = Math.floor(currentTime / 60) % 60;
  const seconds = Math.floor(currentTime % 60);
  const renderHours = `${hours > 0 ? `${hours}:` : ''}`;
  const renderMinutes = `${minutes >= 10 ? minutes : '0' + minutes}`;
  const renderSeconds = `${seconds >= 10 ? seconds : '0' + seconds}`;
  return `${renderHours}${renderMinutes}:${renderSeconds}`;
}

export default function CurrentSoundTimestampSpan() {
  const shouldFormatTimestamp = React.useCallback(async maybeCurrentSound => {
    if (!!maybeCurrentSound && typeof maybeCurrentSound === 'object') {
      if (typeof maybeCurrentSound.getCurrentTime === 'function') {
        const time = await new Promise(resolve =>
          maybeCurrentSound.getCurrentTime(resolve)
        );
        return formatTime(time);
      }
    }
    return DEFAULT_TIMESTAMP;
  }, []);

  const [children, setChildren] = React.useState(DEFAULT_TIMESTAMP);

  const onUpdateInterval = React.useCallback(
    async maybePlayingSound => {
      const nextTimestamp = await shouldFormatTimestamp(maybePlayingSound);
      setChildren(nextTimestamp);
    },
    [setChildren, shouldFormatTimestamp]
  );

  const { currentSound, isPlayingAsset, isPlayingAssetPaused } = useAudio();

  React.useEffect(() => {
    /* nyquist sampling */
    const i = setInterval(
      () => onUpdateInterval(!!isPlayingAsset && currentSound),
      500
    );
    return () => clearInterval(i);
  }, [currentSound, isPlayingAsset, isPlayingAssetPaused, onUpdateInterval]);

  return <>{children}</>;
}
