export default function isETH(addressOrSymbol: string): boolean {
  return addressOrSymbol && addressOrSymbol.toUpperCase() === 'ETH';
}
