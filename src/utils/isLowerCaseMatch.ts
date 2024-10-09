export function isLowerCaseMatch(a: string, b: string) {
  return a?.toLowerCase() === b?.toLowerCase();
}

export const isLowerCaseMatchWorklet = (a?: string, b?: string) => {
  'worklet';
  return a?.toLowerCase() === b?.toLowerCase();
};
