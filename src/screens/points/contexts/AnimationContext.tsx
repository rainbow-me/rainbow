import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

const AnimationContext = createContext({
  currentSequenceIndex: 0,
  getNextAnimationIndex: () => {
    return;
  },
  incrementSequence: () => {
    return;
  },
});

export const useAnimationContext = () => useContext(AnimationContext);

export const TypingAnimation = ({ children }: { children: React.ReactNode }) => {
  const [currentSequenceIndex, setCurrentSequenceIndex] = useState(0);
  const animationIndexRef = useRef(0);

  const getNextAnimationIndex = useCallback(() => {
    const currentIndex = animationIndexRef.current;
    animationIndexRef.current += 1;
    return currentIndex;
  }, []);

  const incrementSequence = useCallback(() => {
    setCurrentSequenceIndex(prevIndex => prevIndex + 1);
  }, []);

  useEffect(() => {
    setCurrentSequenceIndex(0);
    animationIndexRef.current = 0;
  }, []);

  return (
    <AnimationContext.Provider value={{ currentSequenceIndex, getNextAnimationIndex, incrementSequence }}>
      {children}
    </AnimationContext.Provider>
  );
};
