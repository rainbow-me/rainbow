import { useEffect, useState } from 'react';

export function useVariableFont(min, sec) {
  const [size, setSize] = useState('headline');
  const [lineHeight, setLineHeight] = useState(108);
  const [separatorSize, setSeparatorSize] = useState(7);
  const [minuteEndsWithOne, setMinuteEndsWithOne] = useState(false);
  const [displayMinutes, setDisplayMinutes] = useState(min);
  const [displaySeconds, setDisplaySeconds] = useState(sec);

  useEffect(() => {
    setDisplayMinutes(min);
    setDisplaySeconds(sec);
    setMinuteEndsWithOne(false);

    if (min > 0 && sec < 10) {
      // add leading zero in front of single seconds when there are minutes
      setDisplaySeconds(`0${sec}`);
    }

    if (min > 0) {
      setSize(36);
      setLineHeight(41);
      setSeparatorSize(7);
    }

    if (min >= 10) {
      setSize(26);
      setLineHeight(28);
      setSeparatorSize(5);
    }

    if (min % 10 === 1) {
      setMinuteEndsWithOne(true);
    }
  }, [displayMinutes, displaySeconds, min, sec]);

  return {
    displayMinutes,
    displaySeconds,
    lineHeight,
    minuteEndsWithOne,
    separatorSize,
    size,
  };
}
