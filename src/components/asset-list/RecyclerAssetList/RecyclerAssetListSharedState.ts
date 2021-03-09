export type Shared = {
  globalDeviceDimensions: number;
  smallBalancedChanged: boolean;
  coinDividerIndex: number;
};

export default ((): Shared => {
  let globalDeviceDimensions = 0;
  let smallBalancedChanged = false;
  let coinDividerIndex: number = -1;

  return {
    get coinDividerIndex(): number {
      return coinDividerIndex;
    },
    set coinDividerIndex(nextCoinDividerIndex: number) {
      coinDividerIndex = nextCoinDividerIndex;
    },
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
