import toLower from 'lodash/toLower';

export default function isETH(address: string): boolean {
  return toLower(address) === 'eth';
}
