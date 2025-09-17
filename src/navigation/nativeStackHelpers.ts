type Listener = (() => void) | null;

export const appearListener: { current: Listener } = { current: null };

export const setListener = (listener: (() => void) | null) => {
  appearListener.current = listener;
};
