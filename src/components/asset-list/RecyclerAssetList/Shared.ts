export type Shared = {
  globalDeviceDimensions: number;
};

export default ((): Shared => {
  let globalDeviceDimensions = 0;
  return {
    get globalDeviceDimensions(): number {
      return globalDeviceDimensions;
    },
    set globalDeviceDimensions(nextGlobalDeviceDimensions: number) {
      globalDeviceDimensions = nextGlobalDeviceDimensions;
    },
  };
})();
