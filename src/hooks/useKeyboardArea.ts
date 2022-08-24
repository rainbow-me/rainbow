import { useEffect, useState } from 'react';
import { RNKeyboard } from 'react-native-keyboard-area';

let maxKeyboardHeight = 250;

/**
 * Subscibes to keyboard height changes and stores the biggest value to be used
 * inside of useKeyboardMaxArea
 * @returns {Function} - unsubscribe function
 */
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

/**
 * Runs every time keyboard height changes and returns the biggest value so far
 * @returns {number} - max keyboard height we registered so far
 */
export const useKeyboardMaxArea = () => {
  useKeyboardArea();

  return maxKeyboardHeight;
};
