export const isLowerCaseMatch = (a?: string, b?: string) => a?.toLowerCase() === b?.toLowerCase();

export const isLowerCaseMatchWorklet = (a?: string, b?: string) => {
  'worklet';
  return a?.toLowerCase() === b?.toLowerCase();
};

export const capitalize = (s = '') => s.charAt(0).toUpperCase() + s.slice(1);

export const truncateString = (txt = '', maxLength = 22) => {
  return `${txt?.slice(0, maxLength)}${txt.length > maxLength ? '…' : ''}`;
};
