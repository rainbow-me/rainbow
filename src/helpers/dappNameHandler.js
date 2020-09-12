/* eslint-disable sort-keys */
import URL from 'url-parse';

const DisplayDappNames = Object.freeze({
  '88mph.app': '88mph',
  'aave.com': 'Aave',
  'pooltogether.com': 'PoolTogether',
  'matcha.xyz': 'Matcha',
  'uniswap.org': 'Uniswap',
  'compound.finance': 'Compound',
  'dydx.exchange': 'DxDy',
  'oasis.app': 'Oasis',
  'synthetix.exchange': 'Syntethix Echange',
  'curve.fi': 'Curve',
  'balancer.exchange': 'Balancer',
  'mstable.org': 'mStable',
  'kyberswap.com': 'Kyber Swap',
  'opensea.io': 'OpenSea',
  'yearn.finance': 'yEarn',
  'zapper.fi': 'Zapper',
  'zerion.io': 'Zerion',
});

export const dappNameOverride = url => {
  const hostname = getDappHostname(url);
  return DisplayDappNames[hostname];
};

export const getDappHostname = url => {
  const urlObject = new URL(url);
  let hostname;
  const subdomains = urlObject.hostname.split('.');
  if (subdomains.length === 2) {
    hostname = urlObject.hostname;
  } else {
    hostname = `${subdomains[subdomains.length - 2]}.${
      subdomains[subdomains.length - 1]
    }`;
  }
  return hostname;
};
