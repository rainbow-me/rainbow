import { toLower } from 'lodash';

export default function isETH(address: string): boolean {
  return toLower(address) === 'eth';
}
