export const appearListener = { current: null };
export const setAppearListener = listener =>
  (appearListener.current = listener);
