import { useEffect, useState } from 'react';
import { RNKeyboard } from 'react-native-keyboard-area';

let maxKeyboardHeight = 250;
export const trackKeyboardMaxHeight = () => {
  const keyboardHeightChanged = (height: number) => {
    if (height > maxKeyboardHeight) {
      maxKeyboardHeight = height;
    }
  };
  RNKeyboard.addKeyboardListener(keyboardHeightChanged);

  return () => {
    RNKeyboard.removeKeyboardListener(keyboardHeightChanged);
  };
};

export const useKeyboardArea = () => {
  const [currentHeight, setCurrentHeight] = useState(250);

  useEffect(() => {
    const keyboardHeightChanged = (height: number) => {
      setCurrentHeight(height);
    };
    RNKeyboard.addKeyboardListener(keyboardHeightChanged);
    return () => {
      RNKeyboard.removeKeyboardListener(keyboardHeightChanged);
    };
  }, []);

  return currentHeight;
};

export const useKeyboardMaxArea = () => {
  const currentHeight = useKeyboardArea();

  if (currentHeight > maxKeyboardHeight) {
    maxKeyboardHeight = currentHeight;
  }

  return maxKeyboardHeight;
};
