export const appearListener = { current: null };
export const setListener = (listener: any) =>
  (appearListener.current = listener);
