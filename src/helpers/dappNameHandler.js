import URL from 'url-parse';

const buildAssetUrl = hostname =>
  `https://raw.githubusercontent.com/rainbow-me/rainbow/develop/src/assets/dappLogos/${hostname}.jpg`;

const DisplayDappNames = Object.freeze({
  '1inch.exchange': {
    name: '1inch',
    uri: null,
  },
  '88mph.app': {
    name: '88mph',
    uri: buildAssetUrl('88mph.app'),
  },
  'aave.com': {
    name: 'Aave',
    uri: buildAssetUrl('aave.com'),
  },
  'balancer.exchange': {
    name: 'Balancer',
    uri: null,
  },
  'compound.finance': {
    name: 'Compound',
    uri: buildAssetUrl('compound.finance'),
  },
  'cream.finance': {
    name: 'Cream',
    uri: buildAssetUrl('cream.finance'),
  },
  'curve.fi': {
    name: 'Curve',
    uri: null,
  },
  'defisaver.com': {
    name: 'DeFi Saver',
    uri: buildAssetUrl('defisaver.com'),
  },
  'dydx.exchange': {
    name: 'dYdX',
    uri: buildAssetUrl('dydx.exchange'),
  },
  'furucombo.app': {
    name: 'Furucombo',
    uri: buildAssetUrl('furucombo.app'),
  },
  'instadapp.io': {
    name: 'Instadapp',
    uri: null,
  },
  'kyberswap.com': {
    name: 'KyberSwap',
    uri: buildAssetUrl('kyberswap.com'),
  },
  'matcha.xyz': {
    name: 'Matcha',
    uri: buildAssetUrl('matcha.xyz'),
  },
  'mstable.org': {
    name: 'mStable',
    uri: buildAssetUrl('mstable.org'),
  },
  'mycrypto.com': {
    name: 'MyCrypto',
    uri: buildAssetUrl('mycrypto.com'),
  },
  'oasis.app': {
    name: 'Oasis',
    uri: null,
  },
  'opensea.io': {
    name: 'OpenSea',
    uri: buildAssetUrl('opensea.io'),
  },
  'piedao.org': {
    name: 'PieDAO',
    uri: null,
  },
  'pooltogether.com': {
    name: 'PoolTogether',
    uri: buildAssetUrl('pooltogether.com'),
  },
  'rarible.com': {
    name: 'Rarible',
    uri: buildAssetUrl('rarible.com'),
  },
  'sushiswapclassic.org': {
    name: 'SushiSwap',
    uri: buildAssetUrl('sushiswapclassic.org'),
  },
  'swerve.fi': {
    name: 'Swerve',
    uri: buildAssetUrl('swerve.fi'),
  },
  'synthetix.exchange': {
    name: 'Synthetix',
    uri: buildAssetUrl('synthetix.exchange'),
  },
  'tokensets.com': {
    name: 'TokenSets',
    uri: buildAssetUrl('tokensets.com'),
  },
  'umaproject.org': {
    name: 'UMA',
    uri: null,
  },
  'uniswap.org': {
    name: 'Uniswap',
    uri: null,
  },
  'walletconnect.org': {
    name: 'WalletConnect',
    uri: null,
  },
  'yam.finance': {
    name: 'YAM',
    uri: buildAssetUrl('yam.finance'),
  },
  'yearn.finance': {
    name: 'yearn',
    uri: null,
  },
  'zapper.fi': {
    name: 'Zapper',
    uri: buildAssetUrl('zapper.fi'),
  },
  'zerion.io': {
    name: 'Zerion',
    uri: null,
  },
});

export const dappNameOverride = url => {
  const hostname = getDappHostname(url);
  return DisplayDappNames[hostname]?.name;
};

export const isDappAuthenticated = url => {
  const hostname = getDappHostname(url);
  return !!DisplayDappNames[hostname]?.name;
};

export const dappLogoOverride = url => {
  const hostname = getDappHostname(url);
  return DisplayDappNames[hostname]?.uri;
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
