export type Shared = {
  globalDeviceDimensions: number;
  smallBalancedChanged: boolean;
};

export default ((): Shared => {
  let globalDeviceDimensions = 0;
  let smallBalancedChanged = false;

  return {
    get globalDeviceDimensions(): number {
      return globalDeviceDimensions;
    },
    set globalDeviceDimensions(nextGlobalDeviceDimensions: number) {
      globalDeviceDimensions = nextGlobalDeviceDimensions;
    },
    get smallBalancedChanged(): boolean {
      return smallBalancedChanged;
    },
    set smallBalancedChanged(nextSmallBalancedChanged: boolean) {
      smallBalancedChanged = nextSmallBalancedChanged;
    },
  };
})();
