import { useEffect, useState } from 'react';

type VariableFontReturnOptions = {
  displayMinutes: number;
  displaySeconds: number | string;
  lineHeight: number;
  minuteEndsWithOne: boolean;
  separatorSize: number;
  fontSize: number;
};

export function useVariableFont(min: number, sec: number): VariableFontReturnOptions {
  const [fontSize, setFontSize] = useState<number>(50);
  const [lineHeight, setLineHeight] = useState<number>(108);
  const [separatorSize, setSeparatorSize] = useState<number>(7);
  const [minuteEndsWithOne, setMinuteEndsWithOne] = useState<boolean>(false);
  const [displayMinutes, setDisplayMinutes] = useState<number>(min);
  const [displaySeconds, setDisplaySeconds] = useState<number | string>(sec);

  useEffect(() => {
    setDisplayMinutes(min);
    setDisplaySeconds(sec);
    setMinuteEndsWithOne(false);

    if (min > 0 && sec < 10) {
      // add leading zero in front of single seconds when there are minutes
      setDisplaySeconds(`0${sec}`);
    }

    if (min > 0) {
      setFontSize(36);
      setLineHeight(41);
      setSeparatorSize(7);
    }

    if (min >= 10) {
      setFontSize(26);
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
    fontSize,
    lineHeight,
    minuteEndsWithOne,
    separatorSize,
  };
}
