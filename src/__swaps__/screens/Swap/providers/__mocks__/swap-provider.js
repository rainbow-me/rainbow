const SwapProvider = jest.createMockFromModule('@/__swaps__/screens/Swap/providers/swap-provider');

SwapProvider.prototype.executeSwap = jest.fn(() => Promise.resolve());

module.exports = SwapProvider;
