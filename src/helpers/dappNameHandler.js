import URL from 'url-parse';

const buildAssetUrl = hostname =>
  `https://raw.githubusercontent.com/rainbow-me/rainbow/develop/src/assets/dappLogos/${hostname}.jpg`;

const DisplayDappNames = Object.freeze({
  '1inch.io': {
    name: '1inch',
    uri: buildAssetUrl('1inch.io'),
  },
  '88mph.app': {
    name: '88mph',
    uri: buildAssetUrl('88mph.app'),
  },
  'aave.com': {
    name: 'Aave',
    uri: buildAssetUrl('aave.com'),
  },
  'artblocks.io': {
    name: 'Art Blocks',
    uri: buildAssetUrl('artblocks.io'),
  },
  'astrofrens.com': {
    name: 'Astro Frens',
    uri: buildAssetUrl('astrofrens.com'),
  },
  'badger.finance': {
    name: 'Badger DAO',
    uri: null,
  },
  'balancer.exchange': {
    name: 'Balancer',
    uri: null,
  },
  'blit.house': {
    name: 'Blit House',
    uri: buildAssetUrl('blit.house'),
  },
  'blitmap.com': {
    name: 'Blitmap',
    uri: buildAssetUrl('blitmap.com'),
  },
  'collab.land': {
    name: 'Collab.Land',
    uri: buildAssetUrl('collab.land'),
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
    uri: buildAssetUrl('curve.fi'),
  },
  'defisaver.com': {
    name: 'DeFi Saver',
    uri: buildAssetUrl('defisaver.com'),
  },
  'dydx.exchange': {
    name: 'dYdX',
    uri: buildAssetUrl('dydx.exchange'),
  },
  'ens.domains': {
    name: 'ENS',
    uri: buildAssetUrl('ens.domains'),
  },
  'etherscan.io': {
    name: 'Etherscan',
    uri: buildAssetUrl('etherscan.io'),
  },
  'flexa.network': {
    name: 'Flexa',
    uri: buildAssetUrl('flexa.network'),
  },
  'foundation.app': {
    name: 'Foundation',
    uri: buildAssetUrl('foundation.app'),
  },
  'furucombo.app': {
    name: 'Furucombo',
    uri: buildAssetUrl('furucombo.app'),
  },
  'gnosis-safe.io': {
    name: 'Gnosis Safe',
    uri: buildAssetUrl('gnosis-safe.io'),
  },
  'indexcoop.com': {
    name: 'Index',
    uri: buildAssetUrl('indexcoop.com'),
  },
  'instadapp.io': {
    name: 'Instadapp',
    uri: buildAssetUrl('instadapp.io'),
  },
  'kyberswap.com': {
    name: 'KyberSwap',
    uri: buildAssetUrl('kyberswap.com'),
  },
  'matcha.xyz': {
    name: 'Matcha',
    uri: buildAssetUrl('matcha.xyz'),
  },
  'mirror.xyz': {
    name: 'Mirror',
    uri: buildAssetUrl('mirror.xyz'),
  },
  'mstable.org': {
    name: 'mStable',
    uri: buildAssetUrl('mstable.org'),
  },
  'mycrypto.com': {
    name: 'MyCrypto',
    uri: buildAssetUrl('mycrypto.com'),
  },
  'nft20.io': {
    name: 'NFT20',
    uri: buildAssetUrl('nft20.io'),
  },
  'niftygateway.com': {
    name: 'Nifty Gateway',
    uri: buildAssetUrl('niftygateway.com'),
  },
  'oasis.app': {
    name: 'Oasis',
    uri: buildAssetUrl('oasis.app'),
  },
  'opensea.io': {
    name: 'OpenSea',
    uri: buildAssetUrl('opensea.io'),
  },
  'optimism.io': {
    name: 'Optimism Gateway',
    uri: buildAssetUrl('optimism.io'),
  },
  'partybid.app': {
    name: 'PartyBid',
    uri: buildAssetUrl('partybid.app'),
  },
  'piedao.org': {
    name: 'PieDAO',
    uri: null,
  },
  'pooltogether.com': {
    name: 'PoolTogether',
    uri: buildAssetUrl('pooltogether.com'),
  },
  'punks.house': {
    name: 'Punk House',
    uri: buildAssetUrl('punks.house'),
  },
  'quickswap.exchange': {
    name: 'QuickSwap',
    uri: null,
  },
  'rarible.com': {
    name: 'Rarible',
    uri: buildAssetUrl('rarible.com'),
  },
  'snapshot.org': {
    name: 'Snapshot',
    uri: buildAssetUrl('snapshot.org'),
  },
  'superrare.com': {
    name: 'SuperRare',
    uri: buildAssetUrl('superrare.com'),
  },
  'sushi.com': {
    name: 'Sushi',
    uri: null,
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
  'unisocks.exchange': {
    name: 'Unisocks Exchange',
    uri: null,
  },
  'uniswap.org': {
    name: 'Uniswap',
    uri: buildAssetUrl('uniswap.org'),
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
  'zora.co': {
    name: 'Zora',
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
