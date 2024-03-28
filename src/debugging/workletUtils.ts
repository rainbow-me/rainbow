export const consoleLogWorklet = (message?: string) => {
  'worklet';
  console.log('📻 ' + (message || 'WORKLET LOG - NO MESSAGE'));
};
