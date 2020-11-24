import { toUpper } from 'lodash';

export default function isETH(addressOrSymbol: string): boolean {
  return toUpper(addressOrSymbol) === 'ETH';
}
