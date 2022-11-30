import { ethUnits } from '@/references';

const _0_0001ETH_IN_WEI = 100000000000000;
const _0_0001GWEI_IN_WEI = 100000;

export function getFormattedEthFee(weiFee: number): string {
  if (weiFee >= _0_0001ETH_IN_WEI) {
    const valueInEth = (weiFee / ethUnits.ether).toString(10);
    const [integerPart, fractionalPart] = valueInEth.split('.');
    return `${integerPart}.${fractionalPart.substring(0, 6)} Eth`;
  } else if (weiFee < _0_0001ETH_IN_WEI && weiFee >= _0_0001GWEI_IN_WEI) {
    const valueInGwei = weiFee / ethUnits.gwei;
    const valueInGweiString = valueInGwei.toString(10);
    const [integerPart, fractionalPart] = valueInGweiString.split('.');
    const fractionalSpots = valueInGwei >= 1 ? 2 : 6;

    return `${integerPart}.${fractionalPart.substring(
      0,
      fractionalSpots
    )} Gwei`;
  } else {
    return `${weiFee} Wei`;
  }
}
