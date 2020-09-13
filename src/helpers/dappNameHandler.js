import URL from 'url-parse';

const DisplayDappNames = Object.freeze({
  '1inch.exchange': '1inch',
  '88mph.app': '88mph',
  'aave.com': 'Aave',
  'balancer.exchange': 'Balancer',
  'compound.finance': 'Compound',
  'cream.finance': 'Cream',
  'curve.fi': 'Curve',
  'defisaver.com': 'DeFi Saver',
  'dydx.exchange': 'dYdX',
  'instadapp.io': 'Instadapp',
  'kyberswap.com': 'KyberSwap',
  'matcha.xyz': 'Matcha',
  'mstable.org': 'mStable',
  'oasis.app': 'Oasis',
  'opensea.io': 'OpenSea',
  'piedao.org': 'PieDAO',
  'pooltogether.com': 'PoolTogether',
  'rarible.com': 'Rarible',
  'sushiswapclassic.org': 'SushiSwap',
  'swerve.fi': 'Swerve',
  'synthetix.exchange': 'Synthetix',
  'umaproject.org': 'UMA',
  'uniswap.org': 'Uniswap',
  'walletconnect.org': 'WalletConnect',
  'yam.finance': 'YAM',
  'yearn.finance': 'yearn',
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
